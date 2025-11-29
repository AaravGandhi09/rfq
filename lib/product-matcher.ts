// Simple fuzzy string matching for product names
export function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    // Exact match
    if (s1 === s2) return 1.0

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.85

    // Levenshtein distance based similarity
    const distance = levenshteinDistance(s1, s2)
    const maxLength = Math.max(s1.length, s2.length)
    const similarity = 1 - (distance / maxLength)

    return similarity
}

function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }

    return matrix[str2.length][str1.length]
}

export interface Product {
    id: string
    name: string
    description: string | null
    specifications: any
    category: string | null
    base_price: number
    min_price: number | null
    max_price: number | null
    unit: string
    hsn_code: string | null
    is_active: boolean
}

export interface MatchResult {
    product: Product
    similarity: number
}

export function findBestMatch(
    requestedName: string,
    products: Product[],
    threshold: number = 0.7
): MatchResult | null {
    let bestMatch: MatchResult | null = null

    for (const product of products) {
        if (!product.is_active) continue

        const similarity = calculateSimilarity(requestedName, product.name)

        if (similarity >= threshold) {
            if (!bestMatch || similarity > bestMatch.similarity) {
                bestMatch = { product, similarity }
            }
        }
    }

    return bestMatch
}

export function calculateQuotedPrice(
    basePrice: number,
    quantity: number,
    minPrice?: number | null,
    maxPrice?: number | null
): number {
    // Simple quantity-based pricing logic
    let discount = 0

    if (quantity >= 100) {
        discount = 0.15 // 15% discount
    } else if (quantity >= 50) {
        discount = 0.10 // 10% discount
    } else if (quantity >= 20) {
        discount = 0.05 // 5% discount
    }

    let quotedPrice = basePrice * (1 - discount)

    // Ensure price stays within min/max bounds if set
    if (minPrice && quotedPrice < minPrice) {
        quotedPrice = minPrice
    }
    if (maxPrice && quotedPrice > maxPrice) {
        quotedPrice = maxPrice
    }

    return Math.round(quotedPrice * 100) / 100 // Round to 2 decimals
}
