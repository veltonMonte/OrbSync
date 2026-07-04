const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/workspaces',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYWM3NGY2ZS1mMTJjLTQ3YWUtYjI1ZS03ZDQwZmNjYzQ1NjYiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODMwNTM1NjcsImV4cCI6MTc4MzA1NDQ2N30.H2oAFVyQz6gr4jo_5AAot2pbQtP1xJrxm9P8oQZJsIU',
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.write(JSON.stringify({ name: "Test 2", slug: "test-2" }));
req.end();
