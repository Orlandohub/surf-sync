import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn — design-system tokens", () => {
  it("keeps a type role and a text colour side by side", () => {
    expect(cn("text-meta text-muted-foreground")).toBe("text-meta text-muted-foreground");
    expect(cn("text-primary-foreground", "text-meta font-semibold")).toBe(
      "text-primary-foreground text-meta font-semibold",
    );
  });

  it("still resolves conflicts within the same group", () => {
    expect(cn("text-body", "text-label")).toBe("text-label");
    expect(cn("text-foreground", "text-primary")).toBe("text-primary");
    expect(cn("rounded-control", "rounded-card")).toBe("rounded-card");
    expect(cn("shadow-card", "shadow-float")).toBe("shadow-float");
    expect(cn("p-card", "p-3")).toBe("p-3");
  });
});
