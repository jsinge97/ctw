export function makeOrganization(overrides: Partial<{ id: string; name: string; slug: string }> = {}) {
  return { id: "org_test", name: "Test CRE", slug: "test-cre", ...overrides };
}

export function makeUser(overrides: Partial<{ id: string; email: string; role: string }> = {}) {
  return { id: "user_test", email: "am@test.cre", role: "am", ...overrides };
}

export function makeDeal(overrides: Partial<{ id: string; title: string; stage: string }> = {}) {
  return { id: "deal_test", title: "Test Deal", stage: "prospect", ...overrides };
}
