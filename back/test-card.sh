TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYWM3NGY2ZS1mMTJjLTQ3YWUtYjI1ZS03ZDQwZmNjYzQ1NjYiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODMwNTM1NjcsImV4cCI6MTc4MzA1NDQ2N30.H2oAFVyQz6gr4jo_5AAot2pbQtP1xJrxm9P8oQZJsIU"
COL_ID="3f4d79f7-c292-4623-989b-3e7a4fc5c128"
curl -s -X POST http://localhost:3001/api/cards -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "Test Card", "columnId": "'$COL_ID'", "creatorId": "dac74f6e-f12c-47ae-b25e-7d40fccc4566"}'
