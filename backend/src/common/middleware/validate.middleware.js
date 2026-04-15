export function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse({
        params: req.params,
        query: req.query,
        body: req.body
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
