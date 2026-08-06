# Production Checklist

## Automated

- [ ] `npm ci`
- [ ] `npm run verify:release`
- [ ] `npm run audit:production`
- [ ] GitHub Verify workflow passes on the release commit
- [ ] `/api/health` returns HTTP 200
- [ ] `/api/ready` returns HTTP 200 with provider configured
- [ ] Browser console has no errors on desktop, tablet, or mobile
- [ ] Ask Document and Selection AI stream and cancel correctly
- [ ] PDF worker and OCR worker load under production security headers

## Configuration

- [ ] Node.js is `20.19+` or `22.12+`
- [ ] Production uses a dedicated Groq project and key
- [ ] `GROQ_API_KEY` exists only in server secret storage
- [ ] `VITE_API_BASE_URL` is the HTTPS API origin
- [ ] `CORS_ORIGINS` contains only exact trusted frontend origins
- [ ] `TRUST_PROXY=true` only on a trusted managed proxy
- [ ] Rate limits and provider timeout match expected traffic

## Operational

- [ ] Commercial deployment uses plans permitted for production
- [ ] Groq usage and rate limits are monitored
- [ ] Paid Groq deployments configure a spend limit and alerts
- [ ] Frontend and API rollback procedures have been tested
- [ ] Custom domain is added to `CORS_ORIGINS`
- [ ] Host application supplies authentication, persistence, storage, and audit
  retention appropriate to its compliance requirements
