const express = require("express");
const { body, param } = require("express-validator");
const xss = require("xss");

const { dbGet, dbAll, dbRun, dbExists, dbDelete } = require("../database");
const {
  sendError,
  asyncHandler,
  authenticateJWT,
  validateRequest,
} = require("../middleware/auth");
const {
  uploadMiddleware,
  deleteUploadedFile,
} = require("../middleware/upload");

const router = express.Router();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Validate and format Nigerian phone number
 */
function formatPhoneNumber(phone) {
  let formatted = phone.trim();

  // Convert +2348... to 08...
  if (formatted.startsWith("+234")) {
    formatted = "0" + formatted.slice(4);
  }

  // Remove non-digits
  formatted = formatted.replace(/\D/g, "");

  // Validate format
  if (!/^0(70|80|81|90)\d{8}$/.test(formatted)) {
    throw new Error(
      "Phone number must start with 080, 081, 070, or 090 and be 11 digits"
    );
  }

  return formatted;
}

/**
 * Format contact response
 */
function formatContactResponse(contact) {
  if (!contact) return null;

  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    avatar: contact.avatar,
    email: contact.email,
    label: contact.label,
    isFavorite: Boolean(contact.is_favorite),
    notes: contact.notes,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    // Include user status if available
    ...(contact.user_status && {
      userStatus: {
        status: contact.user_status,
        lastSeen: contact.user_last_seen,
        isOnline: contact.user_status === "online",
      },
    }),
  };
}

// ============================================================================
// CONTACT ROUTES
// ============================================================================

/**
 * GET /api/contacts
 * Get all contacts for the current user
 */
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const search = req.query.search?.trim();
    const favoriteOnly = req.query.favorites === "true";
    const sortBy = req.query.sort || "name"; // name, created_at, updated_at
    const sortOrder = req.query.order === "desc" ? "DESC" : "ASC";

    let whereClause = "c.owner_id = ?";
    let params = [req.user.id];

    // Add search filter
    if (search) {
      whereClause += " AND (c.name LIKE ? OR c.phone LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Add favorites filter
    if (favoriteOnly) {
      whereClause += " AND c.is_favorite = TRUE";
    }

    // Build ORDER BY clause
    let orderBy = "c.name ASC";
    if (sortBy === "created_at") {
      orderBy = `c.created_at ${sortOrder}`;
    } else if (sortBy === "updated_at") {
      orderBy = `c.updated_at ${sortOrder}`;
    } else {
      orderBy = `c.is_favorite DESC, c.name ${sortOrder}`;
    }

    const offset = (page - 1) * limit;

    // Get contacts with user status
    const contacts = await dbAll(
      `
    SELECT 
      c.*,
      u.status as user_status,
      u.last_seen as user_last_seen
    FROM contacts c
    LEFT JOIN users u ON c.contact_user_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `,
      [...params, limit, offset]
    );

    // Get total count
    const totalResult = await dbGet(
      `
    SELECT COUNT(*) as total 
    FROM contacts c 
    WHERE ${whereClause}
  `,
      params
    );

    const total = totalResult.total || 0;
    const totalPages = Math.ceil(total / limit);

    const formattedContacts = contacts.map(formatContactResponse);

    res.json({
      contacts: formattedContacts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        search: search || null,
        favoriteOnly,
        sortBy,
        sortOrder,
      },
    });
  })
);

/**
 * GET /api/contacts/:id
 * Get a specific contact
 */
router.get(
  "/:id",
  authenticateJWT,
  [param("id").isInt({ min: 1 }).withMessage("Invalid contact ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const contactId = req.params.id;

    const contact = await dbGet(
      `
    SELECT 
      c.*,
      u.status as user_status,
      u.last_seen as user_last_seen
    FROM contacts c
    LEFT JOIN users u ON c.contact_user_id = u.id
    WHERE c.id = ? AND c.owner_id = ?
  `,
      [contactId, req.user.id]
    );

    if (!contact) {
      return sendError(res, 404, "Contact not found");
    }

    res.json(formatContactResponse(contact));
  })
);

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post(
  "/",
  authenticateJWT,
  uploadMiddleware.avatar,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be 1-100 characters"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Invalid email format"),
    body("label")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Label must be max 50 characters"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be max 500 characters"),
    body("isFavorite")
      .optional()
      .isBoolean()
      .withMessage("isFavorite must be boolean"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    try {
      // Sanitize and validate inputs
      const name = xss(capitalizeWords(req.body.name.trim()));
      const phone = formatPhoneNumber(req.body.phone);
      const email = req.body.email ? xss(req.body.email.trim()) : null;
      const label = req.body.label ? xss(req.body.label.trim()) : null;
      const notes = req.body.notes ? xss(req.body.notes.trim()) : null;
      const isFavorite =
        req.body.isFavorite === true || req.body.isFavorite === "true";

      // Handle avatar
      let avatar = "default.png";
      if (req.uploadedFile) {
        avatar = req.uploadedFile.filename;
      } else if (req.body.avatar?.trim()) {
        avatar = xss(req.body.avatar.trim());
      }

      // Check for duplicate phone number
      const existingContact = await dbGet(
        "SELECT id, name FROM contacts WHERE owner_id = ? AND phone = ?",
        [req.user.id, phone]
      );

      if (existingContact) {
        // Clean up uploaded file if duplicate found
        if (req.uploadedFile) {
          deleteUploadedFile(req.uploadedFile.filename);
        }
        return sendError(
          res,
          409,
          `A contact with phone ${phone} already exists: ${existingContact.name}`
        );
      }

      // Find if there's a registered user with this phone
      const registeredUser = await dbGet(
        "SELECT id FROM users WHERE phone = ? AND is_verified = TRUE",
        [phone]
      );

      // Insert new contact
      const result = await dbRun(
        `
      INSERT INTO contacts (owner_id, contact_user_id, name, phone, email, avatar, label, notes, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          req.user.id,
          registeredUser?.id || null,
          name,
          phone,
          email,
          avatar,
          label,
          notes,
          isFavorite,
        ]
      );

      // Get the created contact with user status
      const contact = await dbGet(
        `
      SELECT 
        c.*,
        u.status as user_status,
        u.last_seen as user_last_seen
      FROM contacts c
      LEFT JOIN users u ON c.contact_user_id = u.id
      WHERE c.id = ?
    `,
        [result.insertId]
      );

      res.status(201).json({
        message: "Contact created successfully",
        contact: formatContactResponse(contact),
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.uploadedFile) {
        deleteUploadedFile(req.uploadedFile.filename);
      }

      if (error.message.includes("Phone number must")) {
        return sendError(res, 400, error.message);
      }
      throw error;
    }
  })
);

/**
 * PUT /api/contacts/:id
 * Update an existing contact
 */
router.put(
  "/:id",
  authenticateJWT,
  uploadMiddleware.avatar,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid contact ID"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be 1-100 characters"),
    body("phone").optional().trim(),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Invalid email format"),
    body("label")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Label must be max 50 characters"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be max 500 characters"),
    body("isFavorite")
      .optional()
      .isBoolean()
      .withMessage("isFavorite must be boolean"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const contactId = req.params.id;

    try {
      // Check if contact exists and belongs to user
      const existingContact = await dbGet(
        "SELECT * FROM contacts WHERE id = ? AND owner_id = ?",
        [contactId, req.user.id]
      );

      if (!existingContact) {
        if (req.uploadedFile) {
          deleteUploadedFile(req.uploadedFile.filename);
        }
        return sendError(res, 404, "Contact not found");
      }

      // Build update object
      const updates = {};

      if (req.body.name !== undefined) {
        updates.name = xss(capitalizeWords(req.body.name.trim()));
      }

      if (req.body.phone !== undefined) {
        updates.phone = formatPhoneNumber(req.body.phone);

        // Check for duplicate phone (excluding current contact)
        const duplicateContact = await dbGet(
          "SELECT id, name FROM contacts WHERE owner_id = ? AND phone = ? AND id != ?",
          [req.user.id, updates.phone, contactId]
        );

        if (duplicateContact) {
          if (req.uploadedFile) {
            deleteUploadedFile(req.uploadedFile.filename);
          }
          return sendError(
            res,
            409,
            `A contact with phone ${updates.phone} already exists: ${duplicateContact.name}`
          );
        }
      }

      if (req.body.email !== undefined) {
        updates.email = req.body.email ? xss(req.body.email.trim()) : null;
      }

      if (req.body.label !== undefined) {
        updates.label = req.body.label ? xss(req.body.label.trim()) : null;
      }

      if (req.body.notes !== undefined) {
        updates.notes = req.body.notes ? xss(req.body.notes.trim()) : null;
      }

      if (req.body.isFavorite !== undefined) {
        updates.is_favorite =
          req.body.isFavorite === true || req.body.isFavorite === "true";
      }

      // Handle avatar update
      if (req.uploadedFile) {
        // Delete old avatar if it's not default
        if (existingContact.avatar !== "default.png") {
          deleteUploadedFile(existingContact.avatar);
        }
        updates.avatar = req.uploadedFile.filename;
      } else if (req.body.avatar !== undefined) {
        updates.avatar = req.body.avatar
          ? xss(req.body.avatar.trim())
          : "default.png";
      }

      if (Object.keys(updates).length === 0) {
        return sendError(res, 400, "No valid fields to update");
      }

      // Find contact_user_id if phone changed
      if (updates.phone) {
        const registeredUser = await dbGet(
          "SELECT id FROM users WHERE phone = ? AND is_verified = TRUE",
          [updates.phone]
        );
        updates.contact_user_id = registeredUser?.id || null;
      }

      // Build and execute update query
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates);

      await dbRun(
        `UPDATE contacts SET ${setClause} WHERE id = ? AND owner_id = ?`,
        [...values, contactId, req.user.id]
      );

      // Get updated contact with user status
      const updatedContact = await dbGet(
        `
      SELECT 
        c.*,
        u.status as user_status,
        u.last_seen as user_last_seen
      FROM contacts c
      LEFT JOIN users u ON c.contact_user_id = u.id
      WHERE c.id = ?
    `,
        [contactId]
      );

      res.json({
        message: "Contact updated successfully",
        contact: formatContactResponse(updatedContact),
      });
    } catch (error) {
      if (req.uploadedFile) {
        deleteUploadedFile(req.uploadedFile.filename);
      }

      if (error.message.includes("Phone number must")) {
        return sendError(res, 400, error.message);
      }
      throw error;
    }
  })
);

/**
 * PUT /api/contacts/:id/favorite
 * Toggle favorite status
 */
router.put(
  "/:id/favorite",
  authenticateJWT,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid contact ID"),
    body("isFavorite").isBoolean().withMessage("isFavorite must be boolean"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const contactId = req.params.id;
    const isFavorite = req.body.isFavorite;

    // Check if contact exists
    const exists = await dbExists(
      "SELECT 1 FROM contacts WHERE id = ? AND owner_id = ?",
      [contactId, req.user.id]
    );

    if (!exists) {
      return sendError(res, 404, "Contact not found");
    }

    // Update favorite status
    await dbRun(
      "UPDATE contacts SET is_favorite = ? WHERE id = ? AND owner_id = ?",
      [isFavorite, contactId, req.user.id]
    );

    res.json({
      message: `Contact ${isFavorite ? "added to" : "removed from"} favorites`,
      isFavorite,
    });
  })
);

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete(
  "/:id",
  authenticateJWT,
  [param("id").isInt({ min: 1 }).withMessage("Invalid contact ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const contactId = req.params.id;

    // Get contact to check ownership and get avatar
    const contact = await dbGet(
      "SELECT avatar FROM contacts WHERE id = ? AND owner_id = ?",
      [contactId, req.user.id]
    );

    if (!contact) {
      return sendError(res, 404, "Contact not found");
    }

    // Delete contact
    const result = await dbDelete("contacts", "id = ? AND owner_id = ?", [
      contactId,
      req.user.id,
    ]);

    if (result.success) {
      // Delete avatar file if it's not default
      if (contact.avatar !== "default.png") {
        deleteUploadedFile(contact.avatar);
      }

      res.json({ message: "Contact deleted successfully" });
    } else {
      return sendError(res, 500, "Failed to delete contact");
    }
  })
);

/**
 * GET /api/contacts/favorites
 * Get favorite contacts
 */
router.get(
  "/favorites",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const favorites = await dbAll(
      `
    SELECT 
      c.*,
      u.status as user_status,
      u.last_seen as user_last_seen
    FROM contacts c
    LEFT JOIN users u ON c.contact_user_id = u.id
    WHERE c.owner_id = ? AND c.is_favorite = TRUE
    ORDER BY c.name ASC
  `,
      [req.user.id]
    );

    const formattedFavorites = favorites.map(formatContactResponse);

    res.json({
      favorites: formattedFavorites,
      count: formattedFavorites.length,
    });
  })
);

module.exports = router;
