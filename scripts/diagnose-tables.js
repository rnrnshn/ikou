#!/usr/bin/env node

/**
 * Diagnostic script to understand why tables appear to exist
 * when they should have been dropped
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  console.log('🔍 Diagnosing Database Tables...\n')

  // Test each "forbidden" table individually to see what the actual error is
  const forbiddenTables = ['users', 'event_attendees', 'community_members']

  for (const table of forbiddenTables) {
    console.log(`\n📋 Testing table: ${table}`)
    console.log('─'.repeat(50))

    try {
      // Try to query the table
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1)

      if (error) {
        console.log(`Error Code: ${error.code}`)
        console.log(`Error Message: ${error.message}`)
        console.log(`Error Details:`, error.details)
        console.log(`Error Hint:`, error.hint)

        if (error.code === '42P01') {
          console.log(`✅ Table does NOT exist (this is good!)`)
        } else if (error.code === '42501') {
          console.log(`⚠️  Table exists but permission denied (RLS blocking)`)
        } else {
          console.log(`⚠️  Table may exist - error: ${error.message}`)
        }
      } else {
        console.log(`⚠️  Table EXISTS and is accessible!`)
        console.log(`Rows: ${count ?? 0}`)
        if (data && data.length > 0) {
          console.log(`Sample columns:`, Object.keys(data[0]))
        }
      }
    } catch (err) {
      console.log(`Exception: ${err.message}`)
    }
  }

  console.log('\n\n📊 Checking correct tables...\n')
  const correctTables = ['profiles', 'communities', 'events', 'rsvps', 'community_followers']

  for (const table of correctTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table.padEnd(25)} - Error: ${error.message}`)
      } else {
        console.log(`✅ ${table.padEnd(25)} - EXISTS (${count ?? 0} rows)`)
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(25)} - Exception: ${err.message}`)
    }
  }

  console.log('\n✨ Diagnostic complete!\n')
}

diagnose().catch(console.error)
