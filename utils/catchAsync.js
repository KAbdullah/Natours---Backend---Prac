export default (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

/* 
To give a run down of what is going on here is,
I am wrapping this function over all the route handlers for error reproduction.
The actual called handler denoted by 'fn' is wrapped inside an anynoymous function 
is because I simply want to return the function and not call it, because
the req, res objects will only be filled once the express server is running and that
specific handler is called. 
The wrapping of anynoymous function over the function received from the wrapper argument is 
standard practice to not call the function immediately. So just learn the pattern.
*/
