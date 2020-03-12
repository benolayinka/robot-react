/**
  * Returns the query parameters as a key/value object. 
  * Example: If the query parameters are
  *
  *    abc=123&def=456&name=gman
  *
  * Then `getQuery()` will return an object like
  *
  *    {
  *      abc: '123',
  *      def: '456',
  *      name: 'gman',
  *    }
  */
export function getQuery() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}