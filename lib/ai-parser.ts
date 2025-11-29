import Groq from 'groq-sdk'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

export interface ExtractedProduct {
    product: string
    quantity: number
    specifications?: string
}

export interface AIExtractionResult {
    success: boolean
    products: ExtractedProduct[]
    confidence: number
    error?: string
    rawResponse?: string
}

export async function extractProductsFromEmail(
    emailBody: string,
    subject?: string
): Promise<AIExtractionResult> {
    try {
        const systemPrompt = `You are an expert at extracting product information from RFQ (Request for Quotation) emails.

Your task:
1. Read the email carefully
2. Extract ALL products mentioned with their quantities and specifications
3. Return ONLY valid JSON in this exact format:
{
  "products": [
    {"product": "Product Name", "quantity": 1, "specifications": "optional specs"}
  ],
  "confidence": 95
}

Rules:
- If no quantity is mentioned, use 1
- Extract product names exactly as written
- Include color, model, size in specifications
- Confidence score 0-100 based on how clear the request is
- If you can't find any products, return empty array with low confidence`

        const userPrompt = `Subject: ${subject || 'RFQ Request'}

Email Body:
${emailBody}

Extract products as JSON:`

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile', // Updated from deprecated llama-3.1-70b
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1, // Low temperature for consistent extraction
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            return {
                success: false,
                products: [],
                confidence: 0,
                error: 'No response from AI'
            }
        }

        const parsed = JSON.parse(content)

        return {
            success: parsed.products && parsed.products.length > 0,
            products: parsed.products || [],
            confidence: parsed.confidence || 0,
            rawResponse: content
        }
    } catch (error: any) {
        console.error('AI extraction error:', error)
        return {
            success: false,
            products: [],
            confidence: 0,
            error: error.message
        }
    }
}

export async function extractProductsFromExcel(
    excelData: any[]
): Promise<AIExtractionResult> {
    try {
        // Sample first 3 rows to identify structure
        const sample = excelData.slice(0, 3)

        const systemPrompt = `You are analyzing Excel data to identify which columns contain product names, quantities, and specifications.

Return ONLY valid JSON in this format:
{
  "productColumn": "column name or index",
  "quantityColumn": "column name or index",  
  "specsColumn": "column name or index (optional)",
  "confidence": 95
}`

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Identify columns:\n${JSON.stringify(sample, null, 2)}` }
            ],
            temperature: 0.1,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            return {
                success: false,
                products: [],
                confidence: 0,
                error: 'Failed to identify Excel columns'
            }
        }

        const columnMap = JSON.parse(content)

        // Extract products using identified columns
        const products: ExtractedProduct[] = excelData.map(row => ({
            product: row[columnMap.productColumn] || '',
            quantity: parseInt(row[columnMap.quantityColumn]) || 1,
            specifications: row[columnMap.specsColumn] || ''
        })).filter(p => p.product)

        return {
            success: products.length > 0,
            products,
            confidence: columnMap.confidence || 0
        }
    } catch (error: any) {
        console.error('Excel extraction error:', error)
        return {
            success: false,
            products: [],
            confidence: 0,
            error: error.message
        }
    }
}
