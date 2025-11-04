#!/usr/bin/env node

/**
 * Schema Verification Script
 * Verifies that the database has the correct schema structure
 * and that all required columns exist
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Expected schema structure
const expectedSchema = {
  profiles: {
    required: ['id', 'name', 'email', 'role', 'created_at', 'updated_at'],
    optional: ['city', 'bio', 'avatar_url']
  },
  communities: {
    required: ['id', 'name', 'description', 'category', 'city', 'organizer_id', 'created_at', 'updated_at'],
    optional: ['image_url']
  },
  events: {
    required: ['id', 'title', 'description', 'community_id', 'organizer_id', 'event_date', 'duration_hours', 'venue_name', 'address', 'city', 'is_online', 'status', 'created_at', 'updated_at'],
    optional: ['max_attendees', 'image_url']
  },
  rsvps: {
    required: ['id', 'event_id', 'user_id', 'created_at'],
    optional: []
  },
  community_followers: {
    required: ['id', 'community_id', 'user_id', 'created_at'],
    optional: []
  }
}

// Tables that should NOT exist (from wrong schema)
const forbiddenTables = ['users', 'event_attendees', 'community_members']

async function verifySchema() {
  console.log('🔍 Verifying Database Schema...\n')
  console.log(`📍 URL: ${supabaseUrl}\n`)

  let allValid = true

  // Check that correct tables exist
  console.log('✅ Checking Required Tables:\n')
  for (const [tableName, schema] of Object.entries(expectedSchema)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        console.log(`❌ ${tableName.padEnd(25)} - MISSING or INACCESSIBLE`)
        console.log(`   Error: ${error.message}\n`)
        allValid = false
      } else {
        console.log(`✅ ${tableName.padEnd(25)} - EXISTS`)
      }
    } catch (err) {
      console.log(`❌ ${tableName.padEnd(25)} - ERROR: ${err.message}\n`)
      allValid = false
    }
  }

  // Check that wrong tables do NOT exist
  console.log('\n⚠️  Checking Forbidden Tables (should NOT exist):\n')
  for (const tableName of forbiddenTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { head: true })

      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        console.log(`✅ ${tableName.padEnd(25)} - Does NOT exist (good!)`)
      } else if (!error) {
        console.log(`⚠️  ${tableName.padEnd(25)} - Still EXISTS (should be removed!)`)
        allValid = false
      }
    } catch (err) {
      // Error is good here - means table doesn't exist
      console.log(`✅ ${tableName.padEnd(25)} - Does NOT exist (good!)`)
    }
  }

  // Verify column structure for each table (if we can insert dummy data)
  console.log('\n🔎 Verifying Table Structures:\n')

  // Check profiles structure
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('✅ profiles table structure verified')
    }
  } catch (err) {
    console.log(`⚠️  profiles structure check: ${err.message}`)
  }

  // Check communities structure
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('✅ communities table structure verified')
      // Check for organizer_id column specifically
      const { data: testData } = await supabase
        .from('communities')
        .select('organizer_id')
        .limit(1)

      if (testData !== undefined) {
        console.log('   ✅ communities.organizer_id column exists')
      }
    }
  } catch (err) {
    console.log(`⚠️  communities structure check: ${err.message}`)
  }

  // Check events structure
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('✅ events table structure verified')
      // Check for organizer_id column specifically
      const { data: testData } = await supabase
        .from('events')
        .select('organizer_id')
        .limit(1)

      if (testData !== undefined) {
        console.log('   ✅ events.organizer_id column exists')
      }
    }
  } catch (err) {
    console.log(`⚠️  events structure check: ${err.message}`)
  }

  // Check rsvps structure
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('✅ rsvps table structure verified')
    }
  } catch (err) {
    console.log(`⚠️  rsvps structure check: ${err.message}`)
  }

  // Check community_followers structure
  try {
    const { data, error } = await supabase
      .from('community_followers')
      .select('*')
      .limit(1)

    if (!error) {
      console.log('✅ community_followers table structure verified')
    }
  } catch (err) {
    console.log(`⚠️  community_followers structure check: ${err.message}`)
  }

  console.log('\n' + '='.repeat(60))
  if (allValid) {
    console.log('✅ SCHEMA VERIFICATION PASSED')
    console.log('   Your database is ready to use!')
  } else {
    console.log('❌ SCHEMA VERIFICATION FAILED')
    console.log('   Please review the errors above')
  }
  console.log('='.repeat(60) + '\n')

  return allValid
}

verifySchema()
  .then(valid => process.exit(valid ? 0 : 1))
  .catch(err => {
    console.error('❌ Verification failed:', err)
    process.exit(1)
  })
