import { useEffect } from 'react';

function usePageTitle(pageName: string) {
  useEffect(() => {
    document.title = `FuelOS — ${pageName}`;
  }, [pageName]);
}

export default usePageTitle;
