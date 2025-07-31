@@ .. @@
const { requireManager } = require('../middleware/auth.js');
 const router = express.Router();

+// Create attendance record (Manager only)
+router.post('/create', requireManager, async (req, res) => {
+  try {
+    const { userId, checkIn, checkOut, notes } = req.body;
+    const organizationId = req.user.organization_id;
+
+    // Verify user belongs to organization
+    const [users] = await db.execute(
+      'SELECT id FROM users WHERE id = ? AND organization_id = ?',
+      [userId, organizationId]
+    );
+
+    if (users.length === 0) {
+      return res.status(404).json({ error: 'User not found' });
+    }
+
+    let totalHours = 0;
+    if (checkOut) {
+      const checkInTime = moment(checkIn);
+      const checkOutTime = moment(checkOut);
+      totalHours = checkOutTime.diff(checkInTime, 'hours', true);
+    }
+
+    const [result] = await db.execute(
+      'INSERT INTO attendance (user_id, check_in, check_out, total_hours, notes) VALUES (?, ?, ?, ?, ?)',
+      [userId, checkIn, checkOut || null, totalHours, notes || '']
+    );
+
+    res.json({
+      message: 'Attendance record created successfully',
+      attendanceId: result.insertId
+    });
+  } catch (error) {
+    console.error('Create attendance error:', error);
+    res.status(500).json({ error: 'Internal server error' });
+  }
+});
+
+// Update attendance record (Manager only)
+router.put('/:attendanceId', requireManager, async (req, res) => {
+  try {
+    const { attendanceId } = req.params;
+    const { checkIn, checkOut, notes } = req.body;
+    const organizationId = req.user.organization_id;
+
+    // Verify attendance record belongs to organization
+    const [records] = await db.execute(
+      `SELECT a.id FROM attendance a 
+       JOIN users u ON a.user_id = u.id 
+       WHERE a.id = ? AND u.organization_id = ?`,
+      [attendanceId, organizationId]
+    );
+
+    if (records.length === 0) {
+      return res.status(404).json({ error: 'Attendance record not found' });
+    }
+
+    let totalHours = 0;
+    if (checkOut) {
+      const checkInTime = moment(checkIn);
+      const checkOutTime = moment(checkOut);
+      totalHours = checkOutTime.diff(checkInTime, 'hours', true);
+    }
+
+    await db.execute(
+      'UPDATE attendance SET check_in = ?, check_out = ?, total_hours = ?, notes = ? WHERE id = ?',
+      [checkIn, checkOut || null, totalHours, notes || '', attendanceId]
+    );
+
+    res.json({ message: 'Attendance record updated successfully' });
+  } catch (error) {
+    console.error('Update attendance error:', error);
+    res.status(500).json({ error: 'Internal server error' });
+  }
+});
+
+// Delete attendance record (Manager only)
+router.delete('/:attendanceId', requireManager, async (req, res) => {
+  try {
+    const { attendanceId } = req.params;
+    const organizationId = req.user.organization_id;
+
+    // Verify attendance record belongs to organization
+    const [records] = await db.execute(
+      `SELECT a.id FROM attendance a 
+       JOIN users u ON a.user_id = u.id 
+       WHERE a.id = ? AND u.organization_id = ?`,
+      [attendanceId, organizationId]
+    );
+
+    if (records.length === 0) {
+      return res.status(404).json({ error: 'Attendance record not found' });
+    }
+
+    await db.execute('DELETE FROM attendance WHERE id = ?', [attendanceId]);
+
+    res.json({ message: 'Attendance record deleted successfully' });
+  } catch (error) {
+    console.error('Delete attendance error:', error);
+    res.status(500).json({ error: 'Internal server error' });
+  }
+});
+
 router.post('/checkin', async (req, res) => {