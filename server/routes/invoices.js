@@ .. @@
 // export default router;
 module.exports = router;
+
+// Delete invoice
+router.delete('/:invoiceId', requireManager, async (req, res) => {
+  try {
+    const { invoiceId } = req.params;
+
+    // Check if invoice exists and belongs to the organization
+    const [invoices] = await db.execute(
+      'SELECT id FROM invoices WHERE id = ? AND organization_id = ?',
+      [invoiceId, req.user.organization_id]
+    );
+
+    if (invoices.length === 0) {
+      return res.status(404).json({ error: 'Invoice not found' });
+    }
+
+    // Delete the invoice
+    await db.execute(
+      'DELETE FROM invoices WHERE id = ? AND organization_id = ?',
+      [invoiceId, req.user.organization_id]
+    );
+
+    res.json({ message: 'Invoice deleted successfully' });
+  } catch (error) {
+    console.error('Delete invoice error:', error);
+    res.status(500).json({ error: 'Internal server error' });
+  }
+});