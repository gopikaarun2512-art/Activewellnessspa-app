#!/bin/bash
# Script to add environment variables to Vercel
# Run this script after logging in with: vercel login

PROJECT_NAME="activewellnessspa-app"

echo "Adding environment variables to Vercel project: $PROJECT_NAME"
echo "Make sure you have run 'vercel login' first!"
echo ""

# Function to add an environment variable
add_env() {
  local name=$1
  local value=$2
  echo "Adding $name..."
  echo "$value" | vercel env add "$name" production preview development --yes 2>/dev/null || \
  echo "$value" | vercel env add "$name" production preview development 2>/dev/null
}

# Add all environment variables
add_env "NEXT_PUBLIC_N8N_WEBHOOK_BASE" "https://awsperth.app.n8n.cloud/webhook"
add_env "NEXT_PUBLIC_PHONE_VALIDATION_PATH" "/validate-phone-and-call"
add_env "NEXT_PUBLIC_FACEBOOK_LEADS_PATH" "/facebook-leads"
add_env "NEXT_PUBLIC_VAPI_TOOLS_PATH" "/vapi-tools"
add_env "NEXT_PUBLIC_VAPI_STATUS_PATH" "/vapi-status"
add_env "NEXT_PUBLIC_QUEUE_WEBHOOK_PATH" "/call-queue-api"
add_env "NEXT_PUBLIC_APP_NAME" "Active Wellness Admin"
add_env "N8N_API_URL" "https://awsperth.app.n8n.cloud/api/v1"
add_env "N8N_API_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwYmVhYS04ODFmLTQ3YTktOWYwNi1jZmY0NzQ5MGI0MjgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3OTkxNjE0fQ.ccAr_leTkW6CgH8cO2bK39o-XG5PuWNyr91SqYbH5NE"
add_env "VAPI_PUBLIC_KEY" "46b01045-7bc6-464f-af02-4167c5ab7ef4"
add_env "VAPI_PRIVATE_KEY" "9da190dd-bd4b-47cd-b229-2dabf3e73eab"
add_env "GHL_API_KEY" "pit-4071aa9d-c90c-4c72-8543-6b41c1b11f7a"
add_env "GHL_LOCATION_ID" "lAUNjMwLwNZbldhmj10d"

echo ""
echo "Done! Now redeploy the project:"
echo "vercel --prod"
