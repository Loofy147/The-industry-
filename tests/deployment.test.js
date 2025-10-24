const http = require('http');
const { server } = require('../server');

describe('Deployment Readiness', () => {

  beforeAll((done) => {
    // Use a different port for the test server to avoid conflicts.
    server.listen(3001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should respond with a 200 OK and a status message from the /healthz endpoint', (done) => {
    http.get('http://localhost:3001/healthz', (res) => {
      expect(res.statusCode).toBe(200);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = JSON.parse(data);
        expect(response.status).toBe('ok');
        done();
      });
    }).on('error', (err) => {
      done(err);
    });
  });
});
