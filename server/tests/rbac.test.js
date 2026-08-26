const test = require('node:test');
const assert = require('node:assert/strict');

const { ROLE_PERMISSIONS, hasPermission } = require('../src/rbac/permissions');

test('RBAC contract matches the project model', () => {
  assert.equal(ROLE_PERMISSIONS.OWNER.includes('VIEW_ANALYTICS'), true);
  assert.equal(ROLE_PERMISSIONS.ADMIN.includes('VIEW_ANALYTICS'), true);
  assert.equal(ROLE_PERMISSIONS.MANAGER.includes('VIEW_ANALYTICS'), true);
  assert.equal(ROLE_PERMISSIONS.DEVELOPER.includes('VIEW_ANALYTICS'), false);
  assert.equal(ROLE_PERMISSIONS.VIEWER.includes('VIEW'), true);
  assert.equal(ROLE_PERMISSIONS.VIEWER.includes('CREATE_TASK'), false);

  assert.equal(hasPermission('MANAGER', 'VIEW_ANALYTICS'), true);
  assert.equal(hasPermission('VIEWER', 'COMMENT_TASK'), false);
  assert.equal(hasPermission('OWNER', 'MANAGE_MEMBERS'), true);
  assert.equal(hasPermission('ADMIN', 'INVITE_MEMBER'), true);
});
