function rawBodyMiddleware(req, res, next) {
  if (req.path === '/webhook' || req.path.includes('webhook') || req.path.includes('test')) {
    let rawBody = '';
    
    req.on('data', (chunk) => {
      rawBody += chunk.toString('utf8');      
    });
    
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
}
export default rawBodyMiddleware;