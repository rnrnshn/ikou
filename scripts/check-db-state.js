#!/usr/bin/env node

/**
 * Script to check the current state of the Supabase database
 * This will help us understand what tables exist and their structure
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseState() {
  console.log('🔍 Checking Supabase Database State...\n')
  console.log(`📍 URL: ${supabaseUrl}\n`)

  const tablesToCheck = [
    'profiles',
    'communities',
    'events',
    'rsvps',
    'community_followers',
    // Old schema tables (shouldn't exist)
    'users',
    'event_attendees',
    'community_members'
  ]

  console.log('📊 Checking tables:\n')

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log(`❌ ${table.padEnd(25)} - Does NOT exist`)
        } else {
          console.log(`⚠️  ${table.padEnd(25)} - Error: ${error.message}`)
        }
      } else {
        console.log(`✅ ${table.padEnd(25)} - EXISTS (${count ?? 0} rows)`)
      }
    } catch (err) {
      console.log(`⚠️  ${table.padEnd(25)} - Error: ${err.message}`)
    }
  }

  // Try to check a specific profile to see structure
  console.log('\n🔎 Checking profiles table structure...')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (!error && data) {
      console.log('✅ Profiles table accessible')
      if (data.length > 0) {
        console.log('📋 Sample profile columns:', Object.keys(data[0]).join(', '))
      }
    } else if (error) {
      console.log('❌ Cannot access profiles:', error.message)
    }
  } catch (err) {
    console.log('❌ Profiles check failed:', err.message)
  }

  // Check communities table structure
  console.log('\n🔎 Checking communities table structure...')
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .limit(1)

    if (!error && data) {
      console.log('✅ Communities table accessible')
      if (data.length > 0) {
        console.log('📋 Sample community columns:', Object.keys(data[0]).join(', '))
      } else {
        console.log('📋 Table exists but is empty')
      }
    } else if (error) {
      console.log('❌ Cannot access communities:', error.message)
    }
  } catch (err) {
    console.log('❌ Communities check failed:', err.message)
  }

  console.log('\n✨ Database check complete!\n')
}

checkDatabaseState().catch(console.error)
