@@ .. @@
 // export default router;
 module.exports = router;
+
+// Password reset
+router.post('/reset-password', async (req, res) => {
+  try {
+    const { organizationName, email, oldPassword, newPassword } = req.body;
+
+    // Find user
+    const [users] = await db.execute(
+      `SELECT u.*, o.name as organization_name 
+       FROM users u 
+       JOIN organizations o ON u.organization_id = o.id 
+       WHERE o.name = ? AND u.email = ? AND u.is_active = true`,
+      [organizationName, email]
+    );
+
+    if (users.length === 0) {
+      return res.status(401).json({ error: 'Invalid credentials' });
+    }
+
+    const user = users[0];
+    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
+
+    if (!isValidPassword) {
+      return res.status(401).json({ error: 'Invalid old password' });
+    }
+
+    // Hash new password and update
+    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
+    await db.execute(
+      'UPDATE users SET password = ? WHERE id = ?',
+      [hashedNewPassword, user.id]
+    );
+
+    res.json({ message: 'Password reset successfully' });
+  } catch (error) {
+    console.error('Password reset error:', error);
+    res.status(500).json({ error: 'Internal server error', details: error.message });
+  }
+});