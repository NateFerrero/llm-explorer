import { GraphData } from "./types";

// Define database structure
interface CachedGraph {
  id: string;
  concept: string;
  data: GraphData;
  timestamp: number;
}

interface CachedArticle {
  id: string;
  nodeId: string;
  concept: string;
  title: string;
  content: string;
  detailLevel: number;
  timestamp: number;
  mainConcept?: string;
}

export interface BookmarkedArticle {
  id: string;
  nodeId: string;
  title: string;
  description?: string;
  content: string;
  timestamp: number;
  mainConcept?: string;
  detailLevel?: number;
  imageUrl?: string;
}

// Add a new interface for graph logs
export interface GraphLog {
  id: string;
  concept: string;
  lastAccessed: number;
  createdAt: number;
  accessCount: number;
  bookmarkCount: number;
}

// Add a new interface for search history
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

// Database initialization
let dbPromise: Promise<IDBDatabase> | null = null;

const DB_NAME = "llm-explorer";
const DB_VERSION = 3;
const GRAPH_STORE = "knowledge-graphs";
const ARTICLE_STORE = "articles";
const BOOKMARK_STORE = "bookmarks";
const GRAPH_LOG_STORE = "graph-logs";
const SEARCH_HISTORY_STORE = "search-history";

export function initDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this browser"));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("Error opening IndexedDB:", event);
        dbPromise = null; // Reset so we can try again later
        reject(new Error("Failed to open IndexedDB database"));
      };

      request.onblocked = (event) => {
        console.warn("Database opening blocked, may be open in another tab");
        dbPromise = null;
        reject(new Error("Database opening blocked"));
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Add a global error handler to the database
        db.onerror = (event) => {
          console.error("Database error:", event);
        };

        console.log(`IndexedDB opened successfully: ${DB_NAME} v${DB_VERSION}`);
        console.log(
          `Available stores: ${Array.from(db.objectStoreNames).join(", ")}`,
        );

        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        console.log(
          `Upgrading database from ${(event as IDBVersionChangeEvent).oldVersion} to ${DB_VERSION}`,
        );
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(GRAPH_STORE)) {
          console.log(`Creating ${GRAPH_STORE} object store`);
          db.createObjectStore(GRAPH_STORE, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(ARTICLE_STORE)) {
          console.log(`Creating ${ARTICLE_STORE} object store`);
          db.createObjectStore(ARTICLE_STORE, { keyPath: "id" });
        }

        // For BOOKMARK_STORE, use 'id' as the keyPath instead of 'nodeId'
        if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
          console.log(`Creating ${BOOKMARK_STORE} object store`);
          db.createObjectStore(BOOKMARK_STORE, { keyPath: "id" });
        } else {
          // If the store already exists with the wrong key, delete and recreate it
          const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
          if (oldVersion < 2) {
            try {
              console.log(`Upgrading ${BOOKMARK_STORE} to use 'id' as keyPath`);
              db.deleteObjectStore(BOOKMARK_STORE);
              db.createObjectStore(BOOKMARK_STORE, { keyPath: "id" });
            } catch (e) {
              console.error("Error upgrading bookmark store:", e);
            }
          }
        }

        // Add the graph logs store
        if (!db.objectStoreNames.contains(GRAPH_LOG_STORE)) {
          console.log(`Creating ${GRAPH_LOG_STORE} object store`);
          db.createObjectStore(GRAPH_LOG_STORE, { keyPath: "id" });
        }

        // Add the search history store
        if (!db.objectStoreNames.contains(SEARCH_HISTORY_STORE)) {
          console.log(`Creating ${SEARCH_HISTORY_STORE} object store`);
          db.createObjectStore(SEARCH_HISTORY_STORE, { keyPath: "id" });
        }
      };
    });
  }

  return dbPromise;
}

// Knowledge Graph cache functions
export async function cacheKnowledgeGraph(
  concept: string,
  data: GraphData,
): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(GRAPH_STORE, "readwrite");
    const store = tx.objectStore(GRAPH_STORE);

    const cachedGraph: CachedGraph = {
      id: `graph-${concept.toLowerCase().replace(/\s+/g, "-")}`,
      concept,
      data,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(cachedGraph);
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error("Error caching graph:", event);
        reject(event);
      };
    });

    console.log(`Knowledge graph for "${concept}" cached successfully`);
  } catch (error) {
    console.error("Failed to cache knowledge graph:", error);
  }
}

export async function getCachedKnowledgeGraph(
  concept: string,
): Promise<GraphData | null> {
  try {
    const db = await initDB();
    const tx = db.transaction(GRAPH_STORE, "readonly");
    const store = tx.objectStore(GRAPH_STORE);

    const graphId = `graph-${concept.toLowerCase().replace(/\s+/g, "-")}`;

    const result = await new Promise<CachedGraph | undefined>(
      (resolve, reject) => {
        const request = store.get(graphId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
          console.error("Error retrieving graph:", event);
          reject(event);
        };
      },
    );

    if (result) {
      console.log(`Loaded cached knowledge graph for "${concept}"`);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("Failed to retrieve cached knowledge graph:", error);
    return null;
  }
}

// Article cache functions
export async function cacheArticle(article: {
  id: string;
  nodeId: string;
  concept: string;
  title: string;
  content: string;
  detailLevel: number;
  timestamp: number;
  mainConcept: string;
  description?: string;
}): Promise<void> {
  try {
    // Convert to a bookmarked article format
    const bookmark: BookmarkedArticle = {
      id: article.id,
      nodeId: article.nodeId,
      title: article.title,
      content: article.content,
      timestamp: article.timestamp,
      mainConcept: article.mainConcept,
      description: article.description,
      detailLevel: article.detailLevel,
    };

    // Use the bookmarkArticle function to save it
    await bookmarkArticle(bookmark);
    console.log(`Cached article for node ${article.nodeId}`);
  } catch (error) {
    console.error("Error caching article:", error);
    throw error;
  }
}

export async function getCachedArticle(
  id: string,
): Promise<CachedArticle | null> {
  try {
    const db = await initDB();

    // Check if ARTICLE_STORE exists
    if (!db.objectStoreNames.contains(ARTICLE_STORE)) {
      console.log("Article store not found when getting cached article");
      await recreateDatabase();
      return null;
    }

    const tx = db.transaction(ARTICLE_STORE, "readonly");
    const store = tx.objectStore(ARTICLE_STORE);

    const article = await new Promise<CachedArticle | null>(
      (resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => {
          console.error("Error getting cached article:", event);
          reject(event);
        };
      },
    );

    return article;
  } catch (error) {
    console.error("Failed to get cached article:", error);
    return null;
  }
}

/**
 * Recreates the database from scratch when there are issues with store structures
 */
export async function recreateDatabase(): Promise<void> {
  try {
    // First, close any existing connections and delete the database
    if (dbPromise) {
      try {
        const db = await dbPromise;
        db.close();
      } catch (e) {
        console.log("Error closing existing database connection:", e);
      }
    }

    // Reset dbPromise so initDB will create a new one
    dbPromise = null;

    // Delete the existing database
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

      deleteRequest.onsuccess = () => {
        console.log("Successfully deleted database for recreation");
        resolve();
      };

      deleteRequest.onerror = (event) => {
        console.error("Error deleting database:", event);
        reject(event);
      };
    });

    // Reinitialize the database
    await initDB();
    console.log("Database recreated successfully");
  } catch (error) {
    console.error("Failed to recreate database:", error);
    throw error;
  }
}

export async function bookmarkArticle(
  article: BookmarkedArticle,
): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(BOOKMARK_STORE, "readwrite");
    const store = tx.objectStore(BOOKMARK_STORE);
    await store.put(article);

    // Use a promise to wait for transaction completion
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    console.log("Article bookmarked successfully:", article.id);
  } catch (error) {
    console.error("Error bookmarking article:", error);
    throw error;
  }
}

export async function removeBookmark(id: string): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(BOOKMARK_STORE, "readwrite");
    const store = tx.objectStore(BOOKMARK_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`Removed bookmark: ${id}`);
        resolve();
      };
      request.onerror = (event) => {
        console.error("Error removing bookmark:", event);
        reject(event);
      };
    });
  } catch (error) {
    console.error("Failed to remove bookmark:", error);

    // Handle NotFoundError specifically
    if (error instanceof DOMException && error.name === "NotFoundError") {
      console.log("Store not found, attempting to recreate database...");
      // Reset the dbPromise to force recreation
      dbPromise = null;
      try {
        // Try again with a fresh database connection
        return removeBookmark(id);
      } catch (retryError) {
        console.error(
          "Failed to remove bookmark after database recreation:",
          retryError,
        );
        throw retryError;
      }
    }

    throw error;
  }
}

export async function isArticleBookmarked(nodeId: string): Promise<boolean> {
  try {
    const db = await initDB();
    const tx = db.transaction(BOOKMARK_STORE, "readonly");
    const store = tx.objectStore(BOOKMARK_STORE);

    // Get the bookmark directly by id
    const bookmark = await new Promise<BookmarkedArticle | undefined>(
      (resolve, reject) => {
        const request = store.get(nodeId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
          console.error("Error checking bookmark:", event);
          reject(event);
        };
      },
    );

    return !!bookmark;
  } catch (error) {
    console.error("Failed to check if article is bookmarked:", error);

    // Handle NotFoundError specifically
    if (error instanceof DOMException && error.name === "NotFoundError") {
      console.log("Store not found, attempting to recreate database...");
      // Reset the dbPromise to force recreation
      dbPromise = null;
      try {
        // Try again with a fresh database connection
        return isArticleBookmarked(nodeId);
      } catch (retryError) {
        console.error(
          "Failed to check bookmark status after database recreation:",
          retryError,
        );
        return false;
      }
    }

    return false;
  }
}

export async function getAllBookmarks(): Promise<BookmarkedArticle[]> {
  try {
    const db = await initDB();
    const tx = db.transaction(BOOKMARK_STORE, "readonly");
    const store = tx.objectStore(BOOKMARK_STORE);

    const bookmarks = await new Promise<BookmarkedArticle[]>(
      (resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => {
          console.error("Error getting all bookmarks:", event);
          reject(event);
        };
      },
    );

    return bookmarks.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to get all bookmarks:", error);

    // Handle NotFoundError specifically
    if (error instanceof DOMException && error.name === "NotFoundError") {
      console.log(
        "Bookmark store not found, attempting to recreate database...",
      );
      // Reset the dbPromise to force recreation
      dbPromise = null;
      try {
        // Try again with a fresh database connection
        await initDB();
        return getAllBookmarks();
      } catch (retryError) {
        console.error(
          "Failed to get bookmarks after database recreation:",
          retryError,
        );
        return [];
      }
    }

    return [];
  }
}

// Clear cache functions (optional)
export async function clearKnowledgeGraphCache(): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(GRAPH_STORE, "readwrite");
    const store = tx.objectStore(GRAPH_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error("Error clearing graph cache:", event);
        reject(event);
      };
    });

    console.log("Knowledge graph cache cleared");
  } catch (error) {
    console.error("Failed to clear knowledge graph cache:", error);
  }
}

export async function clearArticleCache(): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(ARTICLE_STORE, "readwrite");
    const store = tx.objectStore(ARTICLE_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error("Error clearing article cache:", event);
        reject(event);
      };
    });

    console.log("Article cache cleared");
  } catch (error) {
    console.error("Failed to clear article cache:", error);
  }
}

export async function clearBookmarks(): Promise<void> {
  try {
    const db = await initDB();

    // Check if BOOKMARK_STORE exists
    if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
      console.error(
        `${BOOKMARK_STORE} store not found in the database. Attempting to recreate database.`,
      );
      await recreateDatabase();

      // Try again with the recreated database
      const newDb = await initDB();
      if (!newDb.objectStoreNames.contains(BOOKMARK_STORE)) {
        console.error(
          `${BOOKMARK_STORE} store still missing after database recreation`,
        );
        return;
      }

      // Use the new database connection
      const tx = newDb.transaction(BOOKMARK_STORE, "readwrite");
      const store = tx.objectStore(BOOKMARK_STORE);

      await new Promise<void>((resolve) => {
        const request = store.clear();
        request.onsuccess = () => {
          console.log("All bookmarks cleared successfully");
          resolve();
        };
        request.onerror = (event) => {
          console.error("Error clearing bookmarks:", event);
          resolve(); // Resolve instead of reject to avoid errors
        };
      });
      return;
    }

    // Normal flow when store exists
    const tx = db.transaction(BOOKMARK_STORE, "readwrite");
    const store = tx.objectStore(BOOKMARK_STORE);

    await new Promise<void>((resolve) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log("All bookmarks cleared successfully");
        resolve();
      };
      request.onerror = (event) => {
        console.error("Error clearing bookmarks:", event);
        resolve(); // Resolve instead of reject to avoid errors
      };
    });
  } catch (error) {
    console.error("Failed to clear bookmarks:", error);
  }
}

// Function to log knowledge graph usage
export async function logGraphAccess(concept: string): Promise<void> {
  try {
    const db = await initDB();

    // Ensure the store exists
    if (!db.objectStoreNames.contains(GRAPH_LOG_STORE)) {
      console.log("Graph log store not found, skipping log");
      return;
    }

    const tx = db.transaction(GRAPH_LOG_STORE, "readwrite");
    const store = tx.objectStore(GRAPH_LOG_STORE);

    const graphId = `graph-log-${concept.toLowerCase().replace(/\s+/g, "-")}`;

    // Try to get existing log
    const existingLog = await new Promise<GraphLog | undefined>((resolve) => {
      const request = store.get(graphId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });

    const now = Date.now();

    if (existingLog) {
      // Update existing log
      const updatedLog = {
        ...existingLog,
        lastAccessed: now,
        accessCount: existingLog.accessCount + 1,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(updatedLog);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });

      console.log(
        `Updated graph log for "${concept}": ${updatedLog.accessCount} accesses`,
      );
    } else {
      // Create new log
      const newLog: GraphLog = {
        id: graphId,
        concept,
        lastAccessed: now,
        createdAt: now,
        accessCount: 1,
        bookmarkCount: 0,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(newLog);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });

      console.log(`Created new graph log for "${concept}"`);
    }
  } catch (error) {
    console.error("Error logging graph access:", error);
  }
}

// Function to update bookmark count for a concept
export async function updateGraphBookmarkCount(concept: string): Promise<void> {
  try {
    const db = await initDB();

    // Ensure the store exists
    if (!db.objectStoreNames.contains(GRAPH_LOG_STORE)) {
      console.log("Graph log store not found, skipping update");
      return;
    }

    // Count bookmarks for this concept
    const bookmarks = await getAllBookmarks();
    const bookmarksForConcept = bookmarks.filter(
      (b) => b.mainConcept === concept,
    ).length;

    const tx = db.transaction(GRAPH_LOG_STORE, "readwrite");
    const store = tx.objectStore(GRAPH_LOG_STORE);

    const graphId = `graph-log-${concept.toLowerCase().replace(/\s+/g, "-")}`;

    // Try to get existing log
    const existingLog = await new Promise<GraphLog | undefined>((resolve) => {
      const request = store.get(graphId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });

    if (existingLog) {
      // Update bookmark count
      const updatedLog = {
        ...existingLog,
        bookmarkCount: bookmarksForConcept,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(updatedLog);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });

      console.log(
        `Updated bookmark count for "${concept}": ${bookmarksForConcept} bookmarks`,
      );
    } else if (bookmarksForConcept > 0) {
      // Create new log if there are bookmarks but no log yet
      const now = Date.now();
      const newLog: GraphLog = {
        id: graphId,
        concept,
        lastAccessed: now,
        createdAt: now,
        accessCount: 1,
        bookmarkCount: bookmarksForConcept,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(newLog);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });

      console.log(
        `Created new graph log for "${concept}" with ${bookmarksForConcept} bookmarks`,
      );
    }
  } catch (error) {
    console.error("Error updating graph bookmark count:", error);
  }
}

// Function to get all graph logs
export async function getAllGraphLogs(): Promise<GraphLog[]> {
  try {
    const db = await initDB();

    // Ensure the store exists
    if (!db.objectStoreNames.contains(GRAPH_LOG_STORE)) {
      console.log("Graph log store not found, returning empty array");
      return [];
    }

    const tx = db.transaction(GRAPH_LOG_STORE, "readonly");
    const store = tx.objectStore(GRAPH_LOG_STORE);

    const logs = await new Promise<GraphLog[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => {
        console.error("Error getting graph logs:", event);
        reject(event);
      };
    });

    // Sort by last accessed time, most recent first
    return logs.sort((a, b) => b.lastAccessed - a.lastAccessed);
  } catch (error) {
    console.error("Failed to get graph logs:", error);
    return [];
  }
}

// Function to add a query to search history
export async function addToSearchHistory(query: string): Promise<void> {
  if (!query.trim()) return;

  try {
    const db = await initDB();

    // Ensure the store exists
    if (!db.objectStoreNames.contains(SEARCH_HISTORY_STORE)) {
      console.log("Search history store not found, skipping");
      return;
    }

    const tx = db.transaction(SEARCH_HISTORY_STORE, "readwrite");
    const store = tx.objectStore(SEARCH_HISTORY_STORE);

    // Check if this exact query already exists
    const existingQueries = await getAllSearchHistory();
    const exists = existingQueries.some(
      (item) => item.query.toLowerCase() === query.toLowerCase(),
    );

    if (!exists) {
      const historyItem: SearchHistoryItem = {
        id: `query-${Date.now()}`,
        query: query,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(historyItem);
        request.onsuccess = () => {
          console.log(`Added "${query}" to search history`);
          resolve();
        };
        request.onerror = (event) => {
          console.error("Error adding to search history:", event);
          reject(event);
        };
      });

      // Limit history to 20 items by removing oldest if needed
      if (existingQueries.length >= 20) {
        // Sort by timestamp (oldest first)
        const sortedQueries = existingQueries.sort(
          (a, b) => a.timestamp - b.timestamp,
        );

        // Remove oldest items
        const itemsToRemove = sortedQueries.slice(
          0,
          existingQueries.length - 19,
        );

        for (const item of itemsToRemove) {
          await removeFromSearchHistory(item.id);
        }
      }
    }
  } catch (error) {
    console.error("Failed to add to search history:", error);
  }
}

// Function to remove a query from search history
export async function removeFromSearchHistory(id: string): Promise<void> {
  try {
    const db = await initDB();

    if (!db.objectStoreNames.contains(SEARCH_HISTORY_STORE)) {
      console.log("Search history store not found, skipping");
      return;
    }

    const tx = db.transaction(SEARCH_HISTORY_STORE, "readwrite");
    const store = tx.objectStore(SEARCH_HISTORY_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`Removed item ${id} from search history`);
        resolve();
      };
      request.onerror = (event) => {
        console.error("Error removing from search history:", event);
        reject(event);
      };
    });
  } catch (error) {
    console.error("Failed to remove from search history:", error);
  }
}

// Function to get all search history items
export async function getAllSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const db = await initDB();

    if (!db.objectStoreNames.contains(SEARCH_HISTORY_STORE)) {
      console.log("Search history store not found, returning empty array");
      return [];
    }

    const tx = db.transaction(SEARCH_HISTORY_STORE, "readonly");
    const store = tx.objectStore(SEARCH_HISTORY_STORE);

    const items = await new Promise<SearchHistoryItem[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => {
        console.error("Error getting search history:", event);
        reject(event);
      };
    });

    // Sort by timestamp, most recent first
    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to get search history:", error);
    return [];
  }
}

// Function to clear all search history
export async function clearSearchHistory(): Promise<void> {
  try {
    const db = await initDB();

    if (!db.objectStoreNames.contains(SEARCH_HISTORY_STORE)) {
      console.log("Search history store not found, skipping");
      return;
    }

    const tx = db.transaction(SEARCH_HISTORY_STORE, "readwrite");
    const store = tx.objectStore(SEARCH_HISTORY_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log("Search history cleared");
        resolve();
      };
      request.onerror = (event) => {
        console.error("Error clearing search history:", event);
        reject(event);
      };
    });
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}
