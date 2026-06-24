export function connectTables<TParent extends Record<string, any>, TChild extends Record<string, any>>
(parents: TParent[], children: TChild[], parentKey: keyof TParent, childKey: keyof TChild, childField: string) {
    const childrenMap = new Map<any, TChild[]>();

    for (const child of children) {
        const key = child[childKey];
        const list = childrenMap.get(key) ?? [];
        list.push(child);

        childrenMap.set(key, list);
    }

    return parents.map(parent => ({
        ...parent,
        [childField]: childrenMap.get(parent[parentKey]) ?? []
    }))
}