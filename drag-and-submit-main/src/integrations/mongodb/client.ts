// Simple MongoDB Data API client wrapper for the frontend.
// This file expects the MongoDB Atlas Data API to be configured and the
// following environment variables defined in your Vite env:
// VITE_MONGODB_DATA_API_URL - full Data API base URL (e.g. https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1)
// VITE_MONGODB_DATA_API_KEY - Data API key
// VITE_MONGODB_DATA_SOURCE - MongoDB data source / cluster name (default: Cluster0)
// VITE_MONGODB_DATABASE - database name (default: formsdb)

const DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL;
const DATA_API_KEY = import.meta.env.VITE_MONGODB_DATA_API_KEY;
const DATA_SOURCE = import.meta.env.VITE_MONGODB_DATA_SOURCE || 'Cluster0';
const DATABASE = import.meta.env.VITE_MONGODB_DATABASE || 'formsdb';

// If no Data API URL/key is present, we will call a local backend proxy
// which by default connects to MongoDB running at mongodb://localhost:27017
const USE_LOCAL_BACKEND = !DATA_API_URL || !DATA_API_KEY;

const FORMS_COLL = 'forms';
const SUBMISSIONS_COLL = 'form_submissions';

async function callDataApi(action: string, body: any) {
  if (USE_LOCAL_BACKEND) {
    // Map action to local backend endpoints
    const map: Record<string, { method: string; url: string }>= {
      find: { method: 'POST', url: '/api/find' },
      findOne: { method: 'POST', url: '/api/findOne' },
      insertOne: { method: 'POST', url: '/api/insertOne' },
      updateOne: { method: 'POST', url: '/api/updateOne' },
      deleteOne: { method: 'POST', url: '/api/deleteOne' },
    };

    const m = map[action];
    if (!m) throw new Error('Unsupported action for local backend');

    const res = await fetch(m.url, {
      method: m.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Local backend error: ${res.status} ${text}`);
    }
    return res.json();
  }

  if (!DATA_API_URL || !DATA_API_KEY) {
    throw new Error('MongoDB Data API not configured. Set VITE_MONGODB_DATA_API_URL and VITE_MONGODB_DATA_API_KEY.');
  }

  const res = await fetch(`${DATA_API_URL}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': DATA_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MongoDB Data API error: ${res.status} ${text}`);
  }
  return res.json();
}

// Helper to call local backend with a fallback directly to the backend host
async function localFetch(path: string, opts?: RequestInit) {
  // Try same-origin first (so Vite proxy works when configured)
  const tryUrl = path;
  try {
    const res = await fetch(tryUrl, opts);
    // If we received HTML (vite/dev server or other), treat as failure and try direct backend
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // fallback to direct backend host
      const direct = `http://127.0.0.1:3001${path}`;
      return fetch(direct, opts);
    }
    // If 404/other non-ok and body contains Cannot GET, try direct
    if (!res.ok) {
      const text = await res.text();
      if (text.includes('Cannot GET') || text.trim().startsWith('<!DOCTYPE')) {
        const direct = `http://127.0.0.1:3001${path}`;
        return fetch(direct, opts);
      }
      // recreate response with the text (since we've consumed it)
      return new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
    }
    return res;
  } catch (e) {
    // If network fails (proxy/backend down), try direct backend
    try {
      const direct = `http://127.0.0.1:3001${path}`;
      return fetch(direct, opts);
    } catch (e2) {
      throw e;
    }
  }
}

function wrapResult(data: any, error: unknown = null) {
  return { data, error };
}

export async function getForms() {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch('/api/forms');
      if (!res.ok) throw new Error(await res.text());
      const docs = await res.json();
      return wrapResult(docs || []);
    }

    const resp = await callDataApi('find', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: FORMS_COLL,
      filter: {},
      sort: { updated_at: -1 },
    });
    return wrapResult(resp.documents || []);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function getFormById(id: string) {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(await res.text());
      const doc = await res.json();
      return wrapResult(doc || null);
    }

    const resp = await callDataApi('findOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: FORMS_COLL,
      filter: { id },
    });
    return wrapResult(resp.document || null);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function createForm(userId?: string) {
  try {
    const doc = {
      id: crypto.randomUUID(),
      user_id: userId || null,
      title: 'Untitled Form',
      fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      const created = { ...doc, id: body.insertedId || doc.id };
      return wrapResult(created);
    }

    const resp = await callDataApi('insertOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: FORMS_COLL,
      document: doc,
    });

    // Data API returns insertedId; return the created document with id
    const created = { ...doc, id: resp.insertedId || doc.id };
    return wrapResult(created);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function updateForm(id: string, updates: Record<string, unknown>) {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      return wrapResult(body);
    }

    const resp = await callDataApi('updateOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: FORMS_COLL,
      filter: { id },
      update: { $set: { ...updates, updated_at: new Date().toISOString() } },
    });
    return wrapResult(resp);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function deleteFormById(id: string) {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      return wrapResult(body);
    }

    const resp = await callDataApi('deleteOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: FORMS_COLL,
      filter: { id },
    });
    return wrapResult(resp);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function getSubmissions(formId: string) {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(formId)}/submissions`);
      if (!res.ok) throw new Error(await res.text());
      const docs = await res.json();
      return wrapResult(docs || []);
    }

    const resp = await callDataApi('find', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: SUBMISSIONS_COLL,
      filter: { form_id: formId },
      sort: { submitted_at: -1 },
    });
    return wrapResult(resp.documents || []);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function insertSubmission(formId: string, data: Record<string, unknown>) {
  try {
    const doc = {
      id: crypto.randomUUID(),
      form_id: formId,
      data,
      submitted_at: new Date().toISOString(),
    };
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(formId)}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      return wrapResult({ ...doc, id: body.insertedId || doc.id });
    }

    const resp = await callDataApi('insertOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: SUBMISSIONS_COLL,
      document: doc,
    });
    return wrapResult({ ...doc, id: resp.insertedId || doc.id });
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function getSubmissionById(formId: string, submissionId: string) {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`);
      if (!res.ok) throw new Error(await res.text());
      const doc = await res.json();
      return wrapResult(doc || null);
    }

    const resp = await callDataApi('findOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: SUBMISSIONS_COLL,
      filter: { id: submissionId },
    });
    return wrapResult(resp.document || null);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export async function updateSubmission(formId: string, submissionId: string, data: Record<string, unknown>) {
  try {
    if (USE_LOCAL_BACKEND) {
      const res = await localFetch(`/api/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      return wrapResult(body);
    }

    const resp = await callDataApi('updateOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: SUBMISSIONS_COLL,
      filter: { id: submissionId },
      update: { $set: data },
    });
    return wrapResult(resp);
  } catch (e) {
    return wrapResult(null, e);
  }
}

export default {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteFormById,
  getSubmissions,
  insertSubmission,
};
