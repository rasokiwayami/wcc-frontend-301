/* eslint-env node */
import { appendFileSync } from 'node:fs';
import http from 'node:http';

// Synthetic, loopback-only fixture for PR #322. This is not the WCC backend.
const logPath =
  process.argv[2] || new URL('./backend-requests.jsonl', import.meta.url);
const fixtureMentors = ['JAVA', 'PYTHON'].map((language, index) => ({
  id: 9001 + index,
  fullName: `${language === 'JAVA' ? 'Java' : 'Python'} Mentor (mock)`,
  position: 'Synthetic test fixture',
  companyName: 'PR #322',
  email: `fixture-${index + 1}@example.invalid`,
  country: { countryCode: 'ZZ', countryName: 'Local fixture' },
  city: 'Test City',
  images: [],
  network: [],
  profileStatus: 'ACTIVE',
  spokenLanguages: ['English'],
  skills: {
    yearsExperience: 5,
    areas: [{ technicalArea: 'BACKEND', proficiencyLevel: 'ADVANCED' }],
    languages: [{ language, proficiencyLevel: 'ADVANCED' }],
    mentorshipFocus: ['CAREER_ADVICE'],
  },
  menteeSection: { idealMentee: '', additional: '', adHoc: [] },
  acceptMale: false,
  acceptPromotion: false,
}));

const filterSection = {
  types: ['Long-Term', 'Ad-Hoc'],
  skills: {
    yearsExperience: 0,
    mentorshipTypes: ['Long-Term', 'Ad-Hoc'],
    areas: ['BACKEND'],
    languages: ['JAVA', 'PYTHON'],
    mentorshipFocus: ['CAREER_ADVICE'],
  },
};

const servers = [];
for (const [variant, port] of [
  ['before', 3398],
  ['after', 3298],
]) {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET' });
      res.end(
        JSON.stringify({ error: 'Only GET is supported by this fixture' }),
      );
      return;
    }
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/platform/v1/mentorship/cycles/current') {
      res.end(
        JSON.stringify({
          registrationOpen: false,
          mentorshipType: 'Long-Term',
        }),
      );
      return;
    }
    if (url.pathname !== '/api/cms/v1/mentorship/mentors') {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Unknown fixture endpoint' }));
      return;
    }

    // Model the documented controller contract: only plural `languages` binds.
    const languages = url.searchParams
      .getAll('languages')
      .flatMap((value) => value.split(','))
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    const selected = fixtureMentors.filter(
      (mentor) =>
        languages.length === 0 ||
        mentor.skills.languages.some(({ language }) =>
          languages.includes(language),
        ),
    );
    const record = {
      variant,
      method: req.method,
      path: url.pathname,
      query: url.search.slice(1),
      boundLanguages: languages,
      returnedIds: selected.map(({ id }) => id),
      returnedNames: selected.map(({ fullName }) => fullName),
    };
    appendFileSync(logPath, `${JSON.stringify(record)}\n`);
    const bio = `MOCK DATA. Backend received: ${record.query || '(no filters)'}. Returned ${selected.length} of ${fixtureMentors.length} synthetic mentors.`;
    res.end(
      JSON.stringify({
        openCycle: { active: false },
        filterSection,
        mentors: selected.map((mentor) => ({ ...mentor, bio })),
      }),
    );
  });
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(
      `${variant} mock backend on 127.0.0.1:${port}; PID ${process.pid}\n`,
    );
  });
  servers.push(server);
}

const stop = () => {
  for (const server of servers) {
    server.closeAllConnections();
    server.close();
  }
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
