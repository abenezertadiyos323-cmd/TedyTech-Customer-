declare module "convex/react" {
  export const ConvexProvider: any;
  export class ConvexReactClient {
    constructor(url: string);
  }
  export function useQuery(...args: any[]): any;
  export function useMutation(...args: any[]): any;
}
