const fs = require('fs');

async function authFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYWM3NGY2ZS1mMTJjLTQ3YWUtYjI1ZS03ZDQwZmNjYzQ1NjYiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODMwNTM1NjcsImV4cCI6MTc4MzA1NDQ2N30.H2oAFVyQz6gr4jo_5AAot2pbQtP1xJrxm9P8oQZJsIU`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`http://localhost:3001/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Erro na requisição');
  }
  return response;
}

async function test() {
  try {
    let res = await authFetch('/workspaces');
    let wks = await res.json();
    let activeWks = wks[0];
    if (!activeWks) {
        console.log("Creating wks");
        const randomSuffix = Math.floor(Math.random() * 10000);
        const slug = `meu-workspace-${randomSuffix}`;
        let res2 = await authFetch('/workspaces', {
            method: 'POST',
            body: JSON.stringify({ name: 'Meu Workspace', slug }),
        });
        activeWks = await res2.json();
    }
    console.log("Active Wks:", activeWks.id);

    res = await authFetch(`/projects?workspaceId=${activeWks.id}`);
    let projs = await res.json();
    let activeProj = projs[0];
    if (!activeProj) {
        console.log("Creating proj");
        let res2 = await authFetch('/projects', {
            method: 'POST',
            body: JSON.stringify({ workspaceId: activeWks.id, name: 'Desenvolvimento' }),
        });
        activeProj = await res2.json();
    }
    console.log("Active Proj:", activeProj.id);

    let activeBoard = activeProj.boards && activeProj.boards.length > 0 ? activeProj.boards[0] : null;
    if (!activeBoard) {
        console.log("Creating board");
        let res2 = await authFetch('/boards', {
            method: 'POST',
            body: JSON.stringify({ projectId: activeProj.id, name: 'Quadro Principal' }),
        });
        activeBoard = await res2.json();
    }
    console.log("Active Board:", activeBoard.id);

    res = await authFetch(`/columns?boardId=${activeBoard.id}`);
    let cols = await res.json();
    if (cols.length === 0) {
        console.log("Creating cols");
        let r1 = await authFetch('/columns', { method: 'POST', body: JSON.stringify({ boardId: activeBoard.id, name: 'A Fazer', position: 0, color: '#c084fc' }) });
        let col1 = await r1.json();
        let r2 = await authFetch('/columns', { method: 'POST', body: JSON.stringify({ boardId: activeBoard.id, name: 'Em Progresso', position: 1, color: '#3b82f6' }) });
        let col2 = await r2.json();
        let r3 = await authFetch('/columns', { method: 'POST', body: JSON.stringify({ boardId: activeBoard.id, name: 'Concluído', position: 2, color: '#10b981' }) });
        let col3 = await r3.json();
        cols = [col1, col2, col3];
    }
    console.log("Cols:", cols.map(c => c.name));

  } catch (err) {
    console.error("FAILED!", err.message);
  }
}
test();
