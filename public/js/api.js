export async function fetchJson(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

export function getStudents() {
  return fetchJson('/api/students');
}

export function getStudent(id) {
  return fetchJson(`/api/students/${id}`);
}

export function createStudent(body) {
  return fetchJson('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getLocations() {
  return fetchJson('/api/locations');
}

export function getFacultyList() {
  return fetchJson('/api/faculty');
}

export function getFaculty(slug) {
  return fetchJson(`/api/faculty/${slug}`);
}
