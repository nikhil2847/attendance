@@ .. @@
   async getInvoice(invoiceId: number) {
     return this.request(`/invoices/${invoiceId}`);
   }
+
+  async deleteInvoice(invoiceId: number) {
+    return this.request(`/invoices/${invoiceId}`, {
+      method: 'DELETE',
+    });
+  }
+
+  async resetPassword(data: {
+    organizationName: string;
+    email: string;
+    oldPassword: string;
+    newPassword: string;
+  }) {
+    return this.request('/auth/reset-password', {
+      method: 'POST',
+      body: JSON.stringify(data),
+    });
+  }
+
+  async resetUserPassword(userId: number, newPassword: string) {
+    return this.request(`/users/${userId}/reset-password`, {
+      method: 'PUT',
+      body: JSON.stringify({ newPassword }),
+    });
+  }
 
 
 }