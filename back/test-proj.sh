TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYWM3NGY2ZS1mMTJjLTQ3YWUtYjI1ZS03ZDQwZmNjYzQ1NjYiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODMwNTM1NjcsImV4cCI6MTc4MzA1NDQ2N30.H2oAFVyQz6gr4jo_5AAot2pbQtP1xJrxm9P8oQZJsIU"
WKS_ID="6b2545c6-5a25-4688-9a90-fb9d82d3652e"
curl -s -X POST http://localhost:3001/api/projects -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "Desenvolvimento", "workspaceId": "'$WKS_ID'"}'
