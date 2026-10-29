// Success envelope from the assignment: { success: true, message, data }
export const sendSuccess = (res, data = {}, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data })
