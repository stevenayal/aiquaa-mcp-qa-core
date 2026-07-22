import { OperationBlockedError } from "../errors/index.js";

export interface HostPolicyOptions {
  allowedHosts: string[];
}

/** Restricts which hosts the core's HTTP adapters may call. */
export class HostPolicy {
  private readonly allowedHosts: string[];

  constructor(options: HostPolicyOptions) {
    this.allowedHosts = options.allowedHosts.map((host) => host.toLowerCase());
  }

  assertAllowed(url: string): void {
    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      throw new OperationBlockedError(`"${url}" is not a valid URL.`, { details: { url } });
    }
    const allowed = this.allowedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
    if (!allowed) {
      throw new OperationBlockedError(`Host "${hostname}" is not in the allowed host list.`, {
        details: { hostname },
      });
    }
  }

  isAllowed(url: string): boolean {
    try {
      this.assertAllowed(url);
      return true;
    } catch {
      return false;
    }
  }
}
