import { Deployment, Incident, SystemMetrics, FailureCategory, Environment } from '../types';
import { INITIAL_DEPLOYMENTS, INITIAL_INCIDENTS } from './initialData';
import clientPromise from './mongodb';

// In-Memory store fallback
interface MemoryStorage {
  deployments: Deployment[];
  incidents: Incident[];
  lastInitialized: string;
}

const globalForStore = global as typeof globalThis & {
  _deployGuardStore?: MemoryStorage;
};

if (!globalForStore._deployGuardStore) {
  globalForStore._deployGuardStore = {
    deployments: [...INITIAL_DEPLOYMENTS],
    incidents: [...INITIAL_INCIDENTS],
    lastInitialized: new Date().toISOString()
  };
}

const memoryStore = globalForStore._deployGuardStore;

export class DataStore {
  /**
   * Checks if MongoDB is reachable and active.
   */
  public static async isMongoActive(): Promise<boolean> {
    if (!process.env.MONGODB_URI || !clientPromise) {
      return false;
    }
    try {
      const client = await clientPromise;
      await client.db('deployguard_ai').command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  // ===================== DEPLOYMENTS =====================

  public static async getDeployments(filters?: {
    environment?: string;
    status?: string;
    serviceName?: string;
  }): Promise<Deployment[]> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Deployment>('deployments');
        const query: Record<string, unknown> = {};
        if (filters?.environment && filters.environment !== 'all') {
          query.environment = filters.environment;
        }
        if (filters?.status && filters.status !== 'all') {
          query.status = filters.status;
        }
        if (filters?.serviceName && filters.serviceName !== 'all') {
          query.serviceName = filters.serviceName;
        }
        const results = await col.find(query).sort({ startedAt: -1 }).toArray();
        if (results.length > 0) return results;
        // If collection empty, seed it
        await col.insertMany(INITIAL_DEPLOYMENTS);
        return INITIAL_DEPLOYMENTS;
      } catch (err) {
        console.warn('MongoDB query failed, falling back to memory store:', err);
      }
    }

    // Memory fallback
    let list = [...memoryStore.deployments];
    if (filters?.environment && filters.environment !== 'all') {
      list = list.filter((d) => d.environment === filters.environment);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.serviceName && filters.serviceName !== 'all') {
      list = list.filter((d) => d.serviceName === filters.serviceName);
    }

    return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  public static async getDeploymentById(id: string): Promise<Deployment | null> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Deployment>('deployments');
        return await col.findOne({ id });
      } catch (err) {
        console.warn('MongoDB getById failed, using memory fallback:', err);
      }
    }
    return memoryStore.deployments.find((d) => d.id === id) || null;
  }

  public static async createDeployment(deployment: Deployment): Promise<Deployment> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Deployment>('deployments');
        await col.insertOne(deployment);
        return deployment;
      } catch (err) {
        console.warn('MongoDB insert failed, using memory fallback:', err);
      }
    }
    memoryStore.deployments.unshift(deployment);
    return deployment;
  }

  public static async updateDeployment(
    id: string,
    updates: Partial<Deployment>
  ): Promise<Deployment | null> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Deployment>('deployments');
        const res = await col.findOneAndUpdate(
          { id },
          { $set: updates },
          { returnDocument: 'after' }
        );
        if (res) return res as Deployment;
      } catch (err) {
        console.warn('MongoDB update failed, using memory fallback:', err);
      }
    }

    const index = memoryStore.deployments.findIndex((d) => d.id === id);
    if (index === -1) return null;
    memoryStore.deployments[index] = {
      ...memoryStore.deployments[index],
      ...updates
    };
    return memoryStore.deployments[index];
  }

  public static async rollbackDeployment(id: string): Promise<Deployment | null> {
    const existing = await this.getDeploymentById(id);
    if (!existing) return null;

    const previousHealthy = memoryStore.deployments.find(
      (d) => d.serviceName === existing.serviceName && d.status === 'SUCCESS' && d.id !== id
    );

    const rollbackVersion = previousHealthy?.version || 'v1.0.0-stable';
    const rolledBack = await this.updateDeployment(id, {
      status: 'ROLLED_BACK',
      rollbackVersion,
      completedAt: new Date().toISOString()
    });

    return rolledBack;
  }

  // ===================== INCIDENTS =====================

  public static async getIncidents(filters?: {
    status?: string;
    severity?: string;
    search?: string;
  }): Promise<Incident[]> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Incident>('incidents');
        const query: Record<string, unknown> = {};
        if (filters?.status && filters.status !== 'all') {
          query.status = filters.status;
        }
        if (filters?.severity && filters.severity !== 'all') {
          query.severity = filters.severity;
        }
        if (filters?.search && filters.search.trim()) {
          const s = filters.search.trim();
          query.$or = [
            { id: { $regex: s, $options: 'i' } },
            { serviceName: { $regex: s, $options: 'i' } },
            { title: { $regex: s, $options: 'i' } },
            { rootCause: { $regex: s, $options: 'i' } }
          ];
        }
        const results = await col.find(query).sort({ createdAt: -1 }).toArray();
        if (results.length > 0) return results;
        await col.insertMany(INITIAL_INCIDENTS);
        return INITIAL_INCIDENTS;
      } catch (err) {
        console.warn('MongoDB incidents query failed, using memory fallback:', err);
      }
    }

    let list = [...memoryStore.incidents];
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((i) => i.status === filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter((i) => i.severity === filters.severity);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.serviceName.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          (i.error && i.error.toLowerCase().includes(q)) ||
          i.rootCause.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async getIncidentById(id: string): Promise<Incident | null> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Incident>('incidents');
        return await col.findOne({ id });
      } catch (err) {
        console.warn('MongoDB incident getById failed, using memory fallback:', err);
      }
    }
    return memoryStore.incidents.find((i) => i.id === id) || null;
  }

  public static async createIncident(incident: Incident): Promise<Incident> {
    if (!incident.id || incident.id.startsWith('inc-')) {
      const existing = await this.getIncidents();
      const count = existing.length + 1;
      incident.id = `INC-${String(count).padStart(3, '0')}`;
    }

    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Incident>('incidents');
        await col.insertOne(incident);
        return incident;
      } catch (err) {
        console.warn('MongoDB incident insert failed, using memory fallback:', err);
      }
    }
    memoryStore.incidents.unshift(incident);
    return incident;
  }

  public static async updateIncident(
    id: string,
    updates: Partial<Incident>
  ): Promise<Incident | null> {
    if (await this.isMongoActive()) {
      try {
        const client = await clientPromise!;
        const col = client.db('deployguard_ai').collection<Incident>('incidents');
        const res = await col.findOneAndUpdate(
          { id },
          { $set: updates },
          { returnDocument: 'after' }
        );
        if (res) return res as Incident;
      } catch (err) {
        console.warn('MongoDB incident update failed, using memory fallback:', err);
      }
    }

    const index = memoryStore.incidents.findIndex((i) => i.id === id);
    if (index === -1) return null;
    memoryStore.incidents[index] = {
      ...memoryStore.incidents[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return memoryStore.incidents[index];
  }

  // ===================== METRICS & ANALYTICS =====================

  public static async getMetrics(): Promise<SystemMetrics> {
    const deployments = await this.getDeployments();
    const incidents = await this.getIncidents();

    const totalDeployments = deployments.length;
    const successCount = deployments.filter((d) => d.status === 'SUCCESS').length;
    const failedCount = deployments.filter((d) => d.status === 'FAILED').length;
    const successRate = totalDeployments > 0 ? Math.round((successCount / totalDeployments) * 100) : 100;
    const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED').length;

    // Category breakdown
    const categoryBreakdown: Record<FailureCategory, number> = {
      INFRASTRUCTURE: 0,
      DATABASE: 0,
      NETWORK: 0,
      CONFIGURATION: 0,
      DEPENDENCY: 0,
      SECURITY: 0,
      APPLICATION: 0
    };

    incidents.forEach((inc) => {
      if (categoryBreakdown[inc.category] !== undefined) {
        categoryBreakdown[inc.category]++;
      }
    });

    // Environment breakdown
    const environmentBreakdown: Record<Environment, { total: number; failed: number }> = {
      production: { total: 0, failed: 0 },
      staging: { total: 0, failed: 0 },
      development: { total: 0, failed: 0 }
    };

    deployments.forEach((d) => {
      if (environmentBreakdown[d.environment]) {
        environmentBreakdown[d.environment].total++;
        if (d.status === 'FAILED') {
          environmentBreakdown[d.environment].failed++;
        }
      }
    });

    const recentFailureRateTrend = [
      { date: 'Oct 15', success: 14, failed: 1 },
      { date: 'Oct 16', success: 18, failed: 2 },
      { date: 'Oct 17', success: 12, failed: 0 },
      { date: 'Oct 18', success: 16, failed: 3 },
      { date: 'Oct 19', success: 20, failed: 1 },
      { date: 'Oct 20', success: successCount, failed: failedCount }
    ];

    return {
      totalDeployments,
      successRate,
      failedDeployments: failedCount,
      activeIncidents,
      meanTimeToRecoveryMinutes: 22,
      categoryBreakdown,
      environmentBreakdown,
      recentFailureRateTrend
    };
  }

  public static async resetToInitialData(): Promise<{ success: boolean; isMongo: boolean }> {
    const isMongo = await this.isMongoActive();
    const pristineDeployments = JSON.parse(JSON.stringify(INITIAL_DEPLOYMENTS));
    const pristineIncidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));

    if (isMongo) {
      try {
        const client = await clientPromise!;
        const db = client.db('deployguard_ai');
        await db.collection('deployments').deleteMany({});
        await db.collection('incidents').deleteMany({});
        await db.collection('deployments').insertMany(pristineDeployments);
        await db.collection('incidents').insertMany(pristineIncidents);
      } catch (err) {
        console.warn('MongoDB reset failed, falling back to memory reset:', err);
      }
    }

    memoryStore.deployments = pristineDeployments;
    memoryStore.incidents = pristineIncidents;
    memoryStore.lastInitialized = new Date().toISOString();

    return { success: true, isMongo };
  }
}
