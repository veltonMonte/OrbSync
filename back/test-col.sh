TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYWM3NGY2ZS1mMTJjLTQ3YWUtYjI1ZS03ZDQwZmNjYzQ1NjYiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODMwNTM1NjcsImV4cCI6MTc4MzA1NDQ2N30.H2oAFVyQz6gr4jo_5AAot2pbQtP1xJrxm9P8oQZJsIU"
BOARD_ID="b4788db4-f3c9-4490-9c00-61a57d1f3658"
curl -s -X POST http://localhost:3001/api/columns -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "A Fazer", "position": 0, "boardId": "'$BOARD_ID'", "color": "#c084fc"}'
