import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password required' },
                { status: 400 }
            )
        }

        // Fetch admin user
        const { data: admin, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single()

        if (error || !admin) {
            console.log('User not found or error:', error)
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Try bcrypt first, fall back to plain text for initial setup
        let isValid = false

        try {
            isValid = await bcrypt.compare(password, admin.password_hash)

            // If bcrypt returns false, try plain text comparison
            if (!isValid) {
                isValid = password === admin.password_hash
                console.log('Trying plain text comparison:', password === admin.password_hash)
            }
        } catch (bcryptError) {
            // Fallback: check if it's plain text match (for initial setup)
            isValid = password === admin.password_hash
            console.log('Bcrypt error, using plain text:', isValid)
        }

        if (!isValid) {
            console.log('Password mismatch - entered:', password, 'stored:', admin.password_hash)
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Update last login
        await supabaseAdmin
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', admin.id)

        // Generate simple token
        const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64')

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                fullName: admin.full_name
            }
        })
    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
