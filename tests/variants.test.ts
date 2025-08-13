import { expect, test } from "bun:test";

import { selectVariant } from "../src/variants/selector";

const variants = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("random selection returns one of variants", async () => {
  const res = await selectVariant({ strategy: "random", variants });
  expect(res?.variant).toBeTruthy();
});

test("deterministic selection is stable for same seed", async () => {
  const r1 = await selectVariant({ strategy: "deterministic", variants, seed: "user1:conv1" });
  const r2 = await selectVariant({ strategy: "deterministic", variants, seed: "user1:conv1" });
  expect(r1 && r2 && r1.index).toBe(r2 && r2.index);
});

test("round-robin cycles indices", async () => {
  let i = 0;
  const provider = () => ++i;
  const r1 = await selectVariant({ strategy: "round-robin", variants, roundRobinIndexProvider: provider });
  const r2 = await selectVariant({ strategy: "round-robin", variants, roundRobinIndexProvider: provider });
  expect(r1?.index).not.toBe(r2?.index);
});

test("weighted selection prefers heavier weights", async () => {
  // Best-effort stochastic test: heavier weight at index 0 should win often
  const weights = [10, 1, 1];
  let wins0 = 0;
  for (let k = 0; k < 50; k++) {
    const r = await selectVariant({ strategy: "weighted", variants, weights });
    if (r?.index === 0) wins0++;
  }
  expect(wins0).toBeGreaterThan(15);
});


