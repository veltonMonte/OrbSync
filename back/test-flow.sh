TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYWM3NGY2ZS1mMTJjLTQ3YWUtYjI1ZS03ZDQwZmNjYzQ1NjYiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODMwNTM1NjcsImV4cCI6MTc4MzA1NDQ2N30.H2oAFVyQz6gr4jo_5AAot2pbQtP1xJrxm9P8oQZJsIU"

# 1. Workspaces
echo "1. Get Workspaces"
WKS=$(curl -s -X GET http://localhost:3001/api/workspaces -H "Authorization: Bearer $TOKEN")
echo $WKS

WKS_ID=$(echo $WKS | jq -r '.[0].id')
if [ "$WKS_ID" == "null" ]; then
  echo "Creating Workspace..."
  WKS=$(curl -s -X POST http://localhost:3001/api/workspaces -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "Meu Workspace", "slug": "meu-workspace-'$RANDOM'"}')
  echo $WKS
  WKS_ID=$(echo $WKS | jq -r '.id')
fi

# 2. Projects
echo "2. Get Projects for WKS $WKS_ID"
PROJS=$(curl -s -X GET http://localhost:3001/api/projects?workspaceId=$WKS_ID -H "Authorization: Bearer $TOKEN")
echo $PROJS

PROJ_ID=$(echo $PROJS | jq -r '.[0].id')
if [ "$PROJ_ID" == "null" ]; then
  echo "Creating Project..."
  PROJ=$(curl -s -X POST http://localhost:3001/api/projects -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "Desenvolvimento", "workspaceId": "'$WKS_ID'"}')
  echo $PROJ
  PROJ_ID=$(echo $PROJ | jq -r '.id')
fi

# 3. Board
echo "3. Creating Board for PROJ $PROJ_ID"
BOARD=$(curl -s -X POST http://localhost:3001/api/boards -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "Quadro Principal", "projectId": "'$PROJ_ID'"}')
echo $BOARD
BOARD_ID=$(echo $BOARD | jq -r '.id')

# 4. Columns
echo "4. Creating Column for BOARD $BOARD_ID"
COL=$(curl -s -X POST http://localhost:3001/api/columns -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "A Fazer", "position": 0, "boardId": "'$BOARD_ID'"}')
echo $COL
COL_ID=$(echo $COL | jq -r '.id')

# 5. Cards
echo "5. Creating Card for COL $COL_ID"
CARD=$(curl -s -X POST http://localhost:3001/api/cards -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "Test Card", "columnId": "'$COL_ID'"}')
echo $CARD
