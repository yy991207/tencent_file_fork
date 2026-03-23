export function normalizeOrgData(raw) {
  const result = raw?.result ?? raw;

  if (!result || typeof result !== "object") {
    throw new Error("数据格式错误，无法解析组织架构");
  }

  let deptCounter = 0;
  let userCounter = 0;

  const deptMap = new Map();
  const parentMap = new Map();
  const userMap = new Map();

  const createUser = (rawUser) => {
    const baseId = rawUser?.id ? `u-${rawUser.id}` : "u";
    const id = `${baseId}-${userCounter++}`;
    const user = {
      id,
      name: rawUser?.realname || rawUser?.name || "未命名人员",
      title: rawUser?.title || "",
      avatar: rawUser?.avatar || "",
    };
    userMap.set(id, user);
    return user;
  };

  const createDept = (rawDept, parentId, fallbackName) => {
    const baseId = rawDept?.id ? `d-${rawDept.id}` : "d";
    const id = `${baseId}-${deptCounter++}`;
    const node = {
      id,
      name: rawDept?.departName || rawDept?.name || fallbackName || "未命名部门",
      departs: [],
      users: [],
    };

    deptMap.set(id, node);
    if (parentId) {
      parentMap.set(id, parentId);
    }

    const childDeparts = rawDept?.departs || rawDept?.children || [];
    if (Array.isArray(childDeparts)) {
      node.departs = childDeparts.map((child, index) =>
        createDept(child, id, `部门-${index + 1}`)
      );
    }

    const childUsers = rawDept?.users || [];
    if (Array.isArray(childUsers)) {
      node.users = childUsers.map((child) => createUser(child));
    }

    return node;
  };

  const root = {
    id: "root",
    name: "组织架构",
    departs: [],
    users: [],
  };

  deptMap.set(root.id, root);

  if (Array.isArray(result.departs)) {
    root.departs = result.departs.map((dept, index) =>
      createDept(dept, root.id, `部门-${index + 1}`)
    );
  }

  if (Array.isArray(result.users)) {
    root.users = result.users.map((user) => createUser(user));
  }

  return {
    root,
    deptMap,
    parentMap,
    userMap,
  };
}

export function buildDeptUsersMap(root) {
  const map = new Map();

  const collect = (dept) => {
    const userIds = new Set(dept.users.map((user) => user.id));
    dept.departs.forEach((child) => {
      const childUsers = collect(child);
      childUsers.forEach((id) => userIds.add(id));
    });
    map.set(dept.id, userIds);
    return userIds;
  };

  collect(root);
  return map;
}

export function buildDeptPath(deptId, parentMap, deptMap) {
  const path = [];
  let currentId = deptId;

  while (currentId && currentId !== "root") {
    const node = deptMap.get(currentId);
    if (!node) {
      break;
    }
    path.push(node);
    currentId = parentMap.get(currentId);
  }

  return path.reverse();
}

export function searchInDept(node, query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return { departs: node.departs, users: node.users };
  }

  const departs = [];
  const users = [];

  const walk = (dept) => {
    if (dept.name.toLowerCase().includes(keyword)) {
      departs.push(dept);
    }

    dept.users.forEach((user) => {
      if (user.name.toLowerCase().includes(keyword)) {
        users.push(user);
      }
    });

    dept.departs.forEach((child) => walk(child));
  };

  walk(node);

  return { departs, users };
}
