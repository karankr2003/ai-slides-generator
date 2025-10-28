import { NextRequest, NextResponse } from 'next/server'
import PptxGenJS from 'pptxgenjs'
import puppeteer from 'puppeteer'
import { PresentationData, SlideContent } from '@/lib/gemini-service'

export async function POST(request: NextRequest) {
  try {
    const { format = 'pptx', ...presentationData }: PresentationData & { format?: 'pptx' | 'pdf' } = await request.json()
    
    // Validate the presentation data
    if (!presentationData.title || !presentationData.slides || !Array.isArray(presentationData.slides)) {
      return NextResponse.json({ 
        error: 'Invalid presentation data structure',
        details: 'Missing title or slides array'
      }, { status: 400 })
    }

    if (presentationData.slides.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid presentation data',
        details: 'No slides provided'
      }, { status: 400 })
    }
    
    console.log('Generating presentation with data:', {
      title: presentationData.title,
      slideCount: presentationData.slides.length,
      format
    })
    
    if (format === 'pdf') {
      return await generatePDF(presentationData)
    }
    
    // Create a new presentation for PPTX
    const pptx = new PptxGenJS()
    
    // Set presentation properties
    pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 })
    pptx.layout = 'LAYOUT_16x9'
    
    // Set presentation theme
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      bkgd: 'FFFFFF',
      objects: [
        {
          rect: {
            x: 0, y: 0, w: '100%', h: 0.3,
            fill: { color: '2C3E50' }
          }
        }
      ]
    })

    // Add slides based on the data
    console.log('Adding slides to presentation...')
    for (let i = 0; i < presentationData.slides.length; i++) {
      const slide = presentationData.slides[i]
      console.log(`Adding slide ${i + 1}: ${slide.title} (type: ${slide.type})`)
      
      // Validate slide data
      if (!slide.title || !slide.type) {
        throw new Error(`Slide ${i + 1} is missing required properties: title or type`)
      }
      
      try {
        const slideObj = pptx.addSlide()

        // Set slide background
        slideObj.background = { fill: 'FFFFFF' }
        
        // Add header bar
        slideObj.addShape('rect', {
          x: 0, y: 0, w: 10, h: 0.3,
          fill: { color: '2C3E50' }
        })

        // Add slide content based on type
        switch (slide.type) {
          case 'title':
            addTitleSlide(slideObj, slide, i === 0, presentationData.title)
            break
          case 'content':
            addContentSlide(slideObj, slide)
            break
          case 'image':
            addImageSlide(slideObj, slide)
            break
          case 'chart':
            addChartSlide(slideObj, slide)
            break
          default:
            addContentSlide(slideObj, slide)
        }
        console.log(`Slide ${i + 1} added successfully`)
      } catch (slideError) {
        console.error(`Error adding slide ${i + 1}:`, slideError)
        throw new Error(`Failed to add slide ${i + 1}: ${slideError instanceof Error ? slideError.message : 'Unknown error'}`)
      }
    }

    // Generate the presentation as buffer
    console.log('Writing PowerPoint presentation...')
    const buffer = await pptx.write({ outputType: 'nodebuffer' })
    console.log('PowerPoint buffer generated, size:', (buffer as Uint8Array).length)
    
    // Convert to Buffer for NextResponse
    const bufferData = Buffer.from(buffer as Uint8Array)
    console.log('Buffer conversion completed, size:', bufferData.length)
    
    // Return the file as a response
    return new NextResponse(bufferData, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${presentationData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx"`
      }
    })
  } catch (error) {
    console.error('Error generating presentation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Failed to generate presentation', 
      details: errorMessage 
    }, { status: 500 })
  }
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(normalizeText).join('\n')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function parseMarkdown(text: string): { text: string; isBold: boolean }[] {
  const parts: { text: string; isBold: boolean }[] = []
  let current = text
  let boldIndex = 0
  
  while (true) {
    const boldStart = current.indexOf('**', boldIndex)
    if (boldStart === -1) {
      // No more bold markers, add remaining text
      if (current.length > 0) {
        parts.push({ text: current, isBold: false })
      }
      break
    }
    
    // Add text before bold marker
    if (boldStart > 0) {
      parts.push({ text: current.substring(0, boldStart), isBold: false })
    }
    
    // Find closing bold marker
    const boldEnd = current.indexOf('**', boldStart + 2)
    if (boldEnd === -1) {
      // No closing marker, treat as regular text
      parts.push({ text: current.substring(boldStart), isBold: false })
      break
    }
    
    // Add bold text
    const boldText = current.substring(boldStart + 2, boldEnd)
    parts.push({ text: boldText, isBold: true })
    
    // Continue from after the closing marker
    current = current.substring(boldEnd + 2)
    boldIndex = 0
  }
  
  return parts
}

function formatContentForSlides(content: string): { title: string; bullets: string[] } {
  const normalizedContent = normalizeText(content)
  
  // Split by common separators and clean up
  const lines = normalizedContent
    .split(/[,\n]/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const bullets: string[] = []
  let currentTitle = ''
  
  for (const line of lines) {
    if (line.includes('**') && line.includes(':')) {
      // This looks like a title with colon
      const cleanTitle = line.replace(/\*\*/g, '').replace(/:\s*$/, '')
      if (currentTitle === '') {
        currentTitle = cleanTitle
      } else {
        bullets.push(cleanTitle)
      }
    } else if (line.length > 0) {
      bullets.push(line)
    }
  }
  
  // If no title found, use first bullet as title
  if (currentTitle === '' && bullets.length > 0) {
    currentTitle = bullets.shift() || 'Content'
  }
  
  return { title: currentTitle, bullets }
}

function addTitleSlide(slide: any, slideData: SlideContent, isFirstSlide: boolean, presentationTitle: string) {
  if (isFirstSlide) {
    // Main title slide
    slide.addText(presentationTitle, {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: '2C3E50',
      align: 'center',
      valign: 'middle'
    })

    // Add subtitle if available
    if (slideData.content) {
      slide.addText(normalizeText(slideData.content), {
        x: 1,
        y: 3.8,
        w: 8,
        h: 0.8,
        fontSize: 24,
        color: '7F8C8D',
        align: 'center',
        valign: 'middle'
      })
    }
  } else {
    // Section title slide
    slide.addText(slideData.title, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1,
      fontSize: 36,
      bold: true,
      color: '2C3E50',
      align: 'center',
      valign: 'middle'
    })

    if (slideData.content) {
      slide.addText(normalizeText(slideData.content), {
        x: 1,
        y: 3.8,
        w: 8,
        h: 0.8,
        fontSize: 20,
        color: '7F8C8D',
        align: 'center',
        valign: 'middle'
      })
    }
  }
}

function addContentSlide(slide: any, slideData: SlideContent) {
  // Add title
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: '2C3E50',
    align: 'center'
  })

  // Format content properly
  const { title: contentTitle, bullets } = formatContentForSlides(slideData.content)
  
  let yPosition = 1.8
  
  // Add content title if different from slide title
  if (contentTitle && contentTitle !== slideData.title) {
    slide.addText(contentTitle, {
      x: 0.8,
      y: yPosition,
      w: 8.4,
      h: 0.4,
      fontSize: 22,
      bold: true,
      color: '34495E'
    })
    yPosition += 0.5
  }
  
  // Add bullet points
  if (bullets.length > 0) {
    bullets.forEach((bullet, index) => {
      if (bullet.trim()) {
        // Parse markdown for bold text
        const parts = parseMarkdown(bullet.trim())
        
        if (parts.length === 1 && !parts[0].isBold) {
          // Simple text
          slide.addText(`• ${bullet.trim()}`, {
            x: 0.8,
            y: yPosition + (index * 0.45),
            w: 8.4,
            h: 0.4,
            fontSize: 18,
            color: '34495E'
          })
        } else {
          // Complex text with bold parts - add as single text with formatting
          let text = '• '
          parts.forEach(part => {
            text += part.text
          })
          
          slide.addText(text, {
            x: 0.8,
            y: yPosition + (index * 0.45),
            w: 8.4,
            h: 0.4,
            fontSize: 18,
            color: '34495E'
          })
        }
      }
    })
  } else {
    // Fallback to simple content
    const content = normalizeText(slideData.content)
    slide.addText(content, {
      x: 0.5,
      y: yPosition,
      w: 9,
      h: 3,
      fontSize: 18,
      color: '34495E',
      valign: 'top'
    })
  }
}

function addImageSlide(slide: any, slideData: SlideContent) {
  // Add title
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: '2C3E50'
  })

  // Add placeholder for image
  slide.addShape('rect', {
    x: 2,
    y: 1.5,
    w: 6,
    h: 3,
    fill: { color: 'F8F9FA' },
    line: { color: 'BDC3C7', width: 2, dashType: 'dash' }
  })

  slide.addText('[Image Placeholder]', {
    x: 2,
    y: 2.8,
    w: 6,
    h: 0.4,
    fontSize: 16,
    color: '7F8C8D',
    align: 'center',
    valign: 'middle'
  })

  // Add content below image
  if (slideData.content) {
    slide.addText(normalizeText(slideData.content), {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.8,
      fontSize: 16,
      color: '34495E',
      align: 'center'
    })
  }
}

function addChartSlide(slide: any, slideData: SlideContent) {
  // Add title
  slide.addText(slideData.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: '2C3E50'
  })

  // Add placeholder for chart
  slide.addShape('rect', {
    x: 1.5,
    y: 1.5,
    w: 7,
    h: 2.5,
    fill: { color: 'F8F9FA' },
    line: { color: 'BDC3C7', width: 2, dashType: 'dash' }
  })

  slide.addText('[Chart Placeholder]', {
    x: 1.5,
    y: 2.6,
    w: 7,
    h: 0.4,
    fontSize: 16,
    color: '7F8C8D',
    align: 'center',
    valign: 'middle'
  })

  // Add content below chart
  if (slideData.content) {
    slide.addText(normalizeText(slideData.content), {
      x: 0.5,
      y: 4.2,
      w: 9,
      h: 0.8,
      fontSize: 16,
      color: '34495E',
      align: 'center'
    })
  }
}

async function generatePDF(presentationData: PresentationData): Promise<NextResponse> {
  try {
    console.log('Generating PDF presentation...')
    
    // Generate HTML content for the presentation
    const htmlContent = generateHTMLPresentation(presentationData)
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // Set page size to A4 landscape (similar to presentation format)
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    })
    
    await browser.close()
    
    console.log('PDF generated successfully, size:', pdfBuffer.length)
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${presentationData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function generateHTMLPresentation(data: PresentationData): string {
  const slides = data.slides.map((slide, index) => {
    const isFirstSlide = index === 0
    const slideClass = isFirstSlide ? 'title-slide' : 'content-slide'
    
    let content = ''
    
    if (slide.type === 'title' && isFirstSlide) {
      content = `
        <div class="slide-title main-title">${data.title}</div>
        ${slide.content ? `<div class=\"slide-subtitle\">${normalizeText(slide.content)}</div>` : ''}
      `
    } else if (slide.type === 'title') {
      content = `
        <div class="slide-title">${slide.title}</div>
        ${slide.content ? `<div class=\"slide-subtitle\">${normalizeText(slide.content)}</div>` : ''}
      `
    } else if (slide.type === 'content') {
      const { title: contentTitle, bullets } = formatContentForSlides(slide.content)
      
      let contentHtml = `<div class="slide-title">${slide.title}</div>`
      
      if (contentTitle && contentTitle !== slide.title) {
        contentHtml += `<div class="content-subtitle">${contentTitle}</div>`
      }
      
      if (bullets.length > 0) {
        const bulletList = bullets.map(bullet => {
          const parts = parseMarkdown(bullet.trim())
          const bulletHtml = parts.map(part => 
            part.isBold ? `<strong>${part.text}</strong>` : part.text
          ).join('')
          return `<li>${bulletHtml}</li>`
        }).join('')
        
        contentHtml += `<div class="slide-content"><ul>${bulletList}</ul></div>`
      } else {
        const simpleContent = normalizeText(slide.content)
        contentHtml += `<div class="slide-content"><p>${simpleContent}</p></div>`
      }
      
      content = contentHtml
    } else if (slide.type === 'image') {
      content = `
        <div class="slide-title">${slide.title}</div>
        <div class="image-placeholder">[Image Placeholder]</div>
        ${slide.content ? `<div class=\"image-caption\">${normalizeText(slide.content)}</div>` : ''}
      `
    } else if (slide.type === 'chart') {
      content = `
        <div class="slide-title">${slide.title}</div>
        <div class="chart-placeholder">[Chart Placeholder]</div>
        ${slide.content ? `<div class=\"chart-caption\">${normalizeText(slide.content)}</div>` : ''}
      `
    }
    
    return `
      <div class="slide ${slideClass}">
        ${content}
      </div>
    `
  }).join('')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
        }
        
        .slide {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 80px 60px;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          page-break-after: always;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .slide:last-child {
          page-break-after: avoid;
        }
        
        .title-slide {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          justify-content: center;
        }
        
        .main-title {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 30px;
          line-height: 1.2;
        }
        
        .slide-title {
          font-size: 42px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 40px;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slide-subtitle {
          font-size: 28px;
          color: #7f8c8d;
          text-align: center;
          line-height: 1.4;
          margin-bottom: 30px;
        }
        
        .content-subtitle {
          font-size: 24px;
          color: #34495e;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: left;
        }
        
        .slide-content {
          max-width: 85%;
          text-align: left;
        }
        
        .slide-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .slide-content li {
          font-size: 22px;
          color: #34495e;
          margin-bottom: 18px;
          padding-left: 30px;
          position: relative;
          line-height: 1.5;
        }
        
        .slide-content li:before {
          content: "▶";
          color: #3498db;
          font-weight: bold;
          position: absolute;
          left: 0;
          top: 0;
        }
        
        .slide-content p {
          font-size: 22px;
          color: #34495e;
          line-height: 1.6;
          margin: 0;
        }
        
        .slide-content strong {
          color: #2c3e50;
          font-weight: bold;
        }
        
        .image-placeholder,
        .chart-placeholder {
          width: 400px;
          height: 300px;
          border: 2px dashed #bdc3c7;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #7f8c8d;
          margin: 20px 0;
        }
        
        .image-caption,
        .chart-caption {
          font-size: 16px;
          color: #34495e;
          text-align: center;
          margin-top: 15px;
        }
        
        @media print {
          .slide {
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      ${slides}
    </body>
    </html>
  `
}
