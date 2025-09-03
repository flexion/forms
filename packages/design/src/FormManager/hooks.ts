import { useLocation } from 'react-router-dom';

import {
  type RouteData,
  getRouteDataFromQueryString,
} from '@flexion/forms-core';

export const useRouteParams = (): {
  routeParams: RouteData;
  pathname: string;
} => {
  const location = useLocation();
  const queryString = location.search.startsWith('?')
    ? location.search.substring(1)
    : location.search;
  return {
    routeParams: getRouteDataFromQueryString(queryString),
    pathname: location.pathname,
  };
};
