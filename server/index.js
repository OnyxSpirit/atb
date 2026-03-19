import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import db from "./config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Requis pour simuler __dirname

dotenv.config();

// --- FIX pour __dirname en ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // Initialisation de 'app' AVANT utilisation
const port =  5000; // process.env.VITE_PORT ||

// --- Configuration du dossier Uploads ---
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- Middlewares globaux ---
// Configuration précise du CORS
const corsOptions = {
  origin: 'https://atb-manager.netlify.app', // Ton frontend uniquement
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization','Access-Control-Allow-Origin'],
  credentials: true, // Si tu utilises des cookies ou des tokens
  optionsSuccessStatus: 200 // Pour les navigateurs plus anciens (ou 204)
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir)); // Maintenant 'app' est défini !

/*const corsOptions = {
  //origin: 'http://localhost:5000', // Only allow this specific origin
  methods: 'GET,POST',             // Only allow GET and POST requests
  allowedHeaders: ['Content-Type', 'Authorization', 'Cross-Origin', 'Access-Control-Allow-Origin *'], // Only allow these headers
  credentials: true,               // Allow cookies to be sent
  maxAge: 86400                    // Cache preflight response for 24 hours
};*/

// --- Configuration Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = new Date();
    const uniqueName = timestamp.getFullYear() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"));
    }
  },
});

app.post("/api/upload",upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier uploadé" });
    }
    
    res.status(200).json({
      message: "Image uploadée",
      file: req.file.filename,
      url: `/uploads/${req.file.filename}`, // URL accessible
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur upload" });
  }
});

app.post("/api/login", async (_req, res) => {
  // include the primary key so clients can be deleted/edited
  const { email, password } = _req.body;
  const sql = "SELECT * FROM agent WHERE email = ? AND password = ?";
  await db.query(sql, [email, password], (err, results) => {
    if (err) {
      
      return res.status(500).json({
        error: "Erreur côté serveur pour le login",
      });
      
    } else {
      
      return res.json(results);

    }
  });
});
async function client(){
   const sql = "SELECT * FROM client";
  await db.query(sql, (err, results) => {
    if (err) {
       console.log("Erreur dans la fonction de recuperation côté serveur concernant les clients");
    } else {
      console.log (results);
    }
  });
}
client();
app.get("/api/clients", (_req, res) => {
  // include the primary key so clients can be deleted/edited
  const sql = "SELECT * FROM client";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur côté serveur concernant les clients",
      });
    } else {
      return res.json(results);
    }
  });
});

app.get("/api/agents", (_req, res) => {
  // include the primary key so clients can be deleted/edited
  const sql = "SELECT * FROM agent";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur côté serveur",
      });
    } else {
      return res.json(results);
    }
  });
});

app.get("/api/offers", (_req, res) => {
  // include the primary key so clients can be deleted/edited
  const sql = "SELECT * FROM offers";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur côté serveur",
      });
    } else {
      return res.json(results);
    }
  });
});

app.get("/api/get/inventory", (_req, res) => {
  // include the primary key so clients can be deleted/edited
  const sql = "SELECT * FROM inventory";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur côté serveur",
      });
    } else {
      return res.json(results || []);
    }
  });
});

app.get("/api/transactions", (_req, res) => {
  // include the primary key so clients can be deleted/edited
  const sql = "SELECT * FROM gestion";
  db.query(sql, (err, results) => {
    if (err) {
      
      return res.json({
        error: "Erreur côté serveur",
      });
    } else {
      return res.json(results);
    }
  });
});

app.get("/api/subs", (_req, res) => {
  // TODO: adjust query to your subscriptions table if different
  const sql = "SELECT id, name, phone, address, gender, email, subscriptionDuration, amount, startDate, endDate, agent FROM client";
  db.query(sql, (err, results) => {
    if (err) {
      
      return res.json({ error: "Erreur côté serveur" });
    } else {
      return res.json(results);
    }
  });
});

app.get("/api/employees", (_req, res) => {
  // returns all employees; if table not yet created we gracefully return an empty list
  const sql = "SELECT * FROM employee";
  db.query(sql, (err, results) => {
    if (err) {
      return res.json([]);
    } else {
      return res.json(results || []);
    }
  });
});

app.post("/api/post/employees",upload.single("image"),(req, res) => {
  const { name, position, salary, hireDate, status, phone, birthday } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !position || salary == null || !hireDate || !status || !phone || !birthday) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  // Vérifie bien que les noms de colonnes (name, position, salary, hireDate, status, profilePicture) 
  // correspondent exactement à ta table MySQL
  const sql = "INSERT INTO employee (name, position, salary, hireDate, status, profilePicture, phone, birthday) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [name, position, salary, hireDate, status, imagePath, phone, birthday], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Employé créé !", id: result.insertId });
  });
});

app.post("/api/create/agent",upload.single("image"),(req, res) => {
  try{
  const { name, email, role, password, phone, birthday } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  // Vérifie bien que les noms de colonnes (name, position, salary, hireDate, status, profilePicture) 
  // correspondent exactement à ta table MySQL
  const sql = "INSERT INTO agent (name, email, role, password, phone, birthday, profilePicture) VALUES (?, ?, ?, ?, ?, ?, ?)";
  
  db.query(sql, [name, email, role, password, phone, birthday, imagePath], (err, result) => {
    if (err) {
        // Si l'email est unique en DB, on gère l'erreur spécifique
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: "Cet email est déjà utilisé" });
        }
        return res.status(500).json({ error: "Erreur lors de la création du compte" });
      }

      res.status(201).json({ 
        message: "Agent créé avec succès !", 
        id: result.insertId 
      });
    });

  } catch (error) {
    res.status(500).json({ error: "Une erreur interne est survenue" });
  }});

app.put("/api/update/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, position, salary, hireDate, status, phone, birthday } = req.body;
  const fields = [];
  const updates = [];
  if (name) { updates.push("name = ?"); fields.push(name); }
  if (position) { updates.push("position = ?"); fields.push(position); }
  if (salary != null) { updates.push("salary = ?"); fields.push(salary); }
  if (hireDate) { updates.push("hireDate = ?"); fields.push(hireDate); }
  if (status) { updates.push("status = ?"); fields.push(status); }
  if (phone) { updates.push("phone = ?"); fields.push(phone); }
  if (birthday) { updates.push("birthday = ?"); fields.push(birthday); }
  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }
  const sql = `UPDATE employee SET ${updates.join(', ')} WHERE id = ?`;
  fields.push(id);
  db.query(sql, fields, (err) => {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
    return res.json({ message: "Employé mis à jour" });
  });
});
app.put("/api/update/offers/:id", (req, res) => {
  const { id } = req.params;
  const {offer } = req.body;
  const fields = [];
  const updates = [];
  if (offer) { updates.push("offer = ?"); fields.push(offer); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }
  const sql = `UPDATE offers SET ${updates.join(', ')} WHERE id = ?`;
  fields.push(id);
  db.query(sql, fields, (err) => {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
    return res.json({ message: "Offre mise à jour" });
  });
});

app.put("/api/update/agent/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, role, password, phone, birthday } = req.body || {};
  const fields = [];
  const updates = [];
  if (name) { updates.push("name = ?"); fields.push(name); }
  if (email) { updates.push("email = ?"); fields.push(email); }
  if (role) { updates.push("role = ?"); fields.push(role); }
  if (password) { updates.push("password = ?"); fields.push(password); }
  if (phone) { updates.push("phone = ?"); fields.push(phone); }
  if (birthday) { updates.push("birthday = ?"); fields.push(birthday); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }
  const sql = `UPDATE agent SET ${updates.join(', ')} WHERE id = ?`;
  fields.push(id);
  db.query(sql, fields, (err) => {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
    return res.json({ message: "Agent mis à jour" });
  });
});

app.delete("/api/delete/agent/:id", (req, res) => {
  const { id } = req.params;
  // 1. D'abord, on cherche le nom du fichier image associé à cet employé
  const sqlSelect = "SELECT profilePicture FROM agent WHERE id = ?";
  
  db.query(sqlSelect, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur lors de la recherche" });
    
    const fileName = results[0]?.profilePicture; // Ex: /uploads/12345.jpg

    // 2. Supprimer l'employé de la base de données
    const sqlDelete = "DELETE FROM agent WHERE id = ?";
    db.query(sqlDelete, [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur lors de la suppression SQL" });

      // 3. Si l'employé avait une image, on la supprime du dossier 'uploads'
      if (fileName) {
        // On construit le chemin absolu vers le fichier
        // .replace('/uploads/', '') permet d'avoir juste le nom du fichier
        const filePath = path.join(__dirname, "uploads", fileName.replace("/uploads/", ""));

        fs.unlink(filePath, (fsErr) => {
          if (fsErr) {
            // On ne bloque pas la réponse car le client est déjà supprimé en DB
          } else {
            res.json("Fichier image supprimé avec succès");
          }
        });
      }

      return res.json({ message: "agent et image supprimés" });
    });
  });
});

app.delete("/api/delete/employees/:id", (req, res) => {
  const { id } = req.params;
  // 1. D'abord, on cherche le nom du fichier image associé à cet employé
  const sqlSelect = "SELECT profilePicture FROM employee WHERE id = ?";
  
  db.query(sqlSelect, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur lors de la recherche" });
    
    const fileName = results[0]?.profilePicture; // Ex: /uploads/12345.jpg

    // 2. Supprimer l'employé de la base de données
    const sqlDelete = "DELETE FROM employee WHERE id = ?";
    db.query(sqlDelete, [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur lors de la suppression SQL" });

      // 3. Si l'employé avait une image, on la supprime du dossier 'uploads'
      if (fileName) {
        // On construit le chemin absolu vers le fichier
        // .replace('/uploads/', '') permet d'avoir juste le nom du fichier
        const filePath = path.join(__dirname, "uploads", fileName.replace("/uploads/", ""));

        fs.unlink(filePath, (fsErr) => {
          if (fsErr) {
            // On ne bloque pas la réponse car le client est déjà supprimé en DB
          } else {
            res.json("Fichier image supprimé avec succès");
          }
        });
      }

      return res.json({ message: "Employé et image supprimés" });
    });
  });
});

app.post("/api/client/create", upload.single("image"), (req, res) => {
  const { name, phone, address, gender, email, subscriptionDuration, amount, startDate, endDate, nationality, birthday, status, agent, subscription } = req.body;
  
  const formattedStart = typeof startDate === 'string' ? startDate.replace(/-/g, '/') : startDate;
  const formattedEnd = typeof endDate === 'string' ? endDate.replace(/-/g, '/') : endDate;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  // 1. On commence la transaction
  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Erreur d'initialisation de transaction" });

    // 2. Première requête : Insertion du Client
    const sqlClient = "INSERT INTO client (name, phone, address, gender, email, subscriptionDuration, amount, startDate, endDate, nationality, birthday, status, profilePicture, agent, subscription) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sqlClient, [name, phone, address, gender, email, subscriptionDuration, amount, formattedStart, formattedEnd, nationality, birthday, status, imagePath, agent,subscription], (err1, result) => {
      if (err1) {
        return db.rollback(() => { // En cas d'erreur, on annule tout
          res.status(500).json({ error: "Erreur lors de l'ajout du client" });
        });
      }

      // 3. Deuxième requête : Insertion dans la Gestion (Finance)
      const sqlGestion = "INSERT INTO gestion (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)";
      
      db.query(sqlGestion, ['Income', 'Abonnements', amount, formattedStart, `Abonnement pour ${name}`], (err2) => {
        if (err2) {
          return db.rollback(() => { // Si la finance échoue, on annule aussi la création du client !
            res.status(500).json({ error: "Erreur lors de l'enregistrement financier" });
          });
        }

        // 4. Si tout est OK, on valide définitivement les changements
        db.commit((errCommit) => {
          if (errCommit) {
            return db.rollback(() => {
              res.status(500).json({ error: "Erreur lors de la validation finale" });
            });
          }
          res.json({ message: "Client et abonnement enregistrés avec succès !" });
        });
      });
    });
  });
});


app.post("/api/saveExpense", (req, res) => {
  const { type, category, amount, date,description } = req.body;
    const sql = "INSERT INTO gestion (type, category, amount, date,description ) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [type, category, amount, date,description], (err) => {
      if (err) {
        res.json({
          error: "Erreur lors de l'ajout de la dépense",
        });
      } 
        else {
        res.json({
          message: "Dépense ajouté avec succès",
        });
      };
      
    });
    
}
);

app.post("/api/create/offers", (req, res) => {
  const { offer } = req.body;
    const sql = "INSERT INTO offers (offer) VALUES (?)";
    db.query(sql, [offer], (err) => {
      if (err) {
        res.json({
          error: "Erreur lors de l'ajout de la offre",
        });
      } 
        else {
        res.json({
          message: "Offre ajoutée avec succès",
        });
      };
      
    });
    
}
);

app.post("/api/inventory", (req, res) => {
  const { name, category, quantity, minQuantity, unitPrice,lastRestockDate } = req.body;
    const sql = "INSERT INTO inventory (name, category, quantity, minQuantity, unitPrice,lastRestockDate) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [name, category, quantity, minQuantity, unitPrice,lastRestockDate], (err) => {
      if (err) {
        res.json({
          error: "Erreur lors de l'ajout de l'article",

        });
      } 
        else {
        res.json({
          message: "Article ajouté avec succès",
        });
      };
      
    });
    
}
);
// handle sale transactions: decrement inventory and add a gestion entry
app.post("/api/inventory/sell", (req, res) => {
  const { itemId, quantity, itemName, reason, priceTotal } = req.body;
  
  // Validate and coerce inputs
  const idNum = parseInt(itemId, 10);
  const qty = Number(quantity);
  const price = Number(priceTotal) || 0;

  if (!itemId || isNaN(idNum) || !qty || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Données de vente invalides : itemId et quantity (>0) requis' });
  }

  // Check current stock before updating
  const checkStockSql = "SELECT quantity FROM inventory WHERE id = ?";
  db.query(checkStockSql, [idNum], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la vérification du stock' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    const currentStock = results[0].quantity;
    if (currentStock < qty) {
      return res.status(400).json({ error: `Stock insuffisant. Disponible: ${currentStock}, demandé: ${qty}` });
    }

    // Update inventory
    const updateSql = "UPDATE inventory SET quantity = quantity - ? WHERE id = ?";
    db.query(updateSql, [qty, idNum], (err, updateResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
      }

      // Record transaction in gestion
      const insertTx = "INSERT INTO gestion (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)";
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      db.query(insertTx, ['Income', 'Vente', price, date, itemName], (err2) => {
        if (err2) {
          return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la transaction' });
        }

        res.json({ message: 'Vente enregistrée avec succès' });
      });
    });
  });
});
// handle updates to inventory (e.g. restocking) - increment quantity and optionally update lastRestockDate
app.post("/api/inventory/restock", (req, res) => {
  const { id, name, category, unitPrice, quantity, minQuantity, lastRestockDate } = req.body;
  
  // Validate and coerce inputs
  const idNum = parseInt(id, 10);
  const qty = Number(quantity);
  const myDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format


    // Update inventory
    const updateSql = "UPDATE inventory SET name = ?, category = ?, unitPrice = ?, quantity = ?, minQuantity = ?, lastRestockDate = ? WHERE id = ?";
    db.query(updateSql, [name, category, unitPrice, qty, minQuantity, myDate, idNum], (err, updateResult) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
      }
      res.json({ message: 'Stock mis à jour avec succès' });
    });


});

app.delete("/api/client/delete/:id", (req, res) => {
    const { id } = req.params;
  // 1. D'abord, on cherche le nom du fichier image associé à cet employé
  const sqlSelect = "SELECT profilePicture FROM client WHERE id = ?";
  
  db.query(sqlSelect, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur lors de la recherche" });
    
    const fileName = results[0]?.profilePicture; // Ex: /uploads/12345.jpg

    // 2. Supprimer l'employé de la base de données
    const sqlDelete = "DELETE FROM client WHERE id = ?";
    db.query(sqlDelete, [id], (err) => {
      if (err) return res.status(500).json({ error: "Erreur lors de la suppression SQL" });

      // 3. Si l'employé avait une image, on la supprime du dossier 'uploads'
      if (fileName) {
        // On construit le chemin absolu vers le fichier
        // .replace('/uploads/', '') permet d'avoir juste le nom du fichier
        const filePath = path.join(__dirname, "uploads", fileName.replace("/uploads/", ""));

        fs.unlink(filePath, (fsErr) => {
          if (fsErr) {
            // On ne bloque pas la réponse car le client est déjà supprimé en DB
          } else {
          res.json("Fichier image supprimé avec succès");
          }
        });
      }

      return res.json({ message: "Client supprimé avec succès" });
    });
  });

 });

app.delete("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  if (!id || isNaN(idNum)) {
    return res.status(400).json({ error: `ID invalide: ${id}` });
  }

  const sql = "DELETE FROM inventory WHERE id = ?";
  db.query(sql, [idNum], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur lors de la suppression de l'article",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Article non trouvé" });
    }

    res.json({
      message: "Article supprimé avec succès",
      id,
    });
  });
});

app.delete("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  if (!id || isNaN(idNum)) {
    return res.status(400).json({ error: `ID invalide: ${id}` });
  }

  const sql = "DELETE FROM gestion WHERE id = ?";
  db.query(sql, [idNum], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur lors de la suppression de la transaction",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Transaction non trouvée" });
    }

    res.json({
      message: "Transaction supprimée avec succès",
      id,
    });
  });
});

app.delete("/api/delete/offers/:id", (req, res) => {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  if (!id || isNaN(idNum)) {
    return res.status(400).json({ error: `ID invalide: ${id}` });
  }

  const sql = "DELETE FROM offers WHERE id = ?";
  db.query(sql, [idNum], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur lors de la suppression de l'offre",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Offre non trouvée" });
    }

    res.json({
      message: "Offre supprimée avec succès",
      id,
    });
  });
});




app.listen(port);
