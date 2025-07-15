// Sales link management services for LVL3.ai Sales Portal
import { v4 as uuidv4 } from 'uuid';
import { 
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  getDocs,
  where,
  query,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, isFirebaseInitialized } from './firebase.js';

// Generate a new sales link for a user
export const generateSalesLink = async (userId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Generate a mock link for demo purposes
    const linkId = Math.random().toString(36).substring(2, 10);
    const baseUrl = window.location.origin;
    const fullLink = `${baseUrl}?ref=${linkId}`;
    
    const newLink = {
      id: linkId,
      url: fullLink,
      createdAt: new Date().toISOString(),
      clicks: 0,
      conversions: 0
    };
    
    return { 
      success: true, 
      link: newLink,
      mockMode: true
    };
  }

  try {
    // Generate a unique ID for the link
    const linkId = uuidv4().substring(0, 8);
    const baseUrl = window.location.origin;
    const fullLink = `${baseUrl}?ref=${linkId}`;
    
    // Add link to user document
    const userRef = doc(db, 'users', userId);
    const newLink = {
      id: linkId,
      url: fullLink,
      createdAt: serverTimestamp(),
      clicks: 0,
      conversions: 0
    };
    
    await updateDoc(userRef, {
      salesLinks: arrayUnion(newLink)
    });
    
    // Also create a separate document for tracking
    await setDoc(doc(db, 'links', linkId), {
      userId,
      url: fullLink,
      createdAt: serverTimestamp(),
      clicks: 0,
      conversions: 0
    });
    
    return { success: true, link: newLink };
  } catch (error) {
    console.error('Error generating sales link:', error.message);
    return { success: false, error: error.message };
  }
};

// Get all sales links for a user
export const getUserLinks = async (userId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Return mock data for demo purposes
    return { 
      success: true, 
      links: [
        {
          id: 'mock-link-1',
          url: `${window.location.origin}?ref=mock-link-1`,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          clicks: 24,
          conversions: 5
        },
        {
          id: 'mock-link-2',
          url: `${window.location.origin}?ref=mock-link-2`,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          clicks: 12,
          conversions: 2
        }
      ],
      mockMode: true
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { success: true, links: userData.salesLinks || [] };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user links:', error.message);
    return { success: false, error: error.message };
  }
};

// Track a click on a sales link
export const trackLinkClick = async (linkId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    return { 
      success: true,
      mockMode: true
    };
  }

  try {
    // Update the link document
    const linkRef = doc(db, 'links', linkId);
    await updateDoc(linkRef, {
      clicks: increment(1),
      lastClickedAt: serverTimestamp()
    });
    
    // Find which user owns this link and update their record too
    const linkDoc = await getDoc(linkRef);
    if (linkDoc.exists()) {
      const linkData = linkDoc.data();
      const userId = linkData.userId;
      
      // This is more complex since we need to update a specific item in an array
      // In a real implementation, you might use a Cloud Function for this
      // For now, we'll just update the link document and rely on that
      
      return { success: true };
    }
    
    return { success: false, error: 'Link not found' };
  } catch (error) {
    console.error('Error tracking link click:', error.message);
    return { success: false, error: error.message };
  }
};

// Record a conversion from a sales link
export const recordConversion = async (linkId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    return { 
      success: true,
      mockMode: true
    };
  }

  try {
    const linkRef = doc(db, 'links', linkId);
    const linkDoc = await getDoc(linkRef);
    
    if (!linkDoc.exists()) {
      return { success: false, error: 'Link not found' };
    }
    
    // Increment conversion counter atomically
    await updateDoc(linkRef, {
      conversions: increment(1),
      lastConversionAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error recording conversion:', error.message);
    return { success: false, error: error.message };
  }
};

// Get analytics for all user links
export const getUserAnalytics = async (userId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Return mock analytics data for demo purposes
    const totalLinks = 2;
    const totalClicks = 36;
    const totalConversions = 7;
    const conversionRate = (totalConversions / totalClicks) * 100;

    return {
      success: true,
      analytics: {
        totalLinks,
        totalClicks,
        totalConversions,
        conversionRate: conversionRate.toFixed(2),
        links: [
          {
            id: 'mock-link-1',
            url: `${window.location.origin}?ref=mock-link-1`,
            clicks: 24,
            conversions: 5,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          },
          {
            id: 'mock-link-2',
            url: `${window.location.origin}?ref=mock-link-2`,
            clicks: 12,
            conversions: 2,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          }
        ]
      },
      mockMode: true
    };
  }

  try {
    const linksQuery = query(
      collection(db, 'links'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(linksQuery);
    const analytics = {
      totalLinks: 0,
      totalClicks: 0,
      totalConversions: 0,
      links: []
    };
    
    querySnapshot.forEach((doc) => {
      const link = doc.data();
      analytics.totalLinks++;
      analytics.totalClicks += link.clicks || 0;
      analytics.totalConversions += link.conversions || 0;
      analytics.links.push({
        id: doc.id,
        url: link.url,
        clicks: link.clicks || 0,
        conversions: link.conversions || 0,
        createdAt: link.createdAt
      });
    });
    
    const conversionRate = analytics.totalClicks > 0 ? (analytics.totalConversions / analytics.totalClicks) * 100 : 0;
    
    return {
      success: true,
      analytics: {
        totalLinks: analytics.totalLinks,
        totalClicks: analytics.totalClicks,
        totalConversions: analytics.totalConversions,
        conversionRate: conversionRate.toFixed(2),
        links: analytics.links
      }
    };
  } catch (error) {
    console.error('Error getting link analytics:', error.message);
    return { success: false, error: error.message };
  }
};

// Get analytics for a specific link
export const getSingleLinkAnalytics = async (linkId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    console.log('Firebase not initialized, using mock mode');
    // Return mock analytics data for demo purposes
    const clicks = 24;
    const conversions = 5;
    const conversionRate = (conversions / clicks) * 100;

    return {
      success: true,
      analytics: {
        linkId: linkId || 'mock-link-id',
        url: `${window.location.origin}?ref=${linkId || 'mock-link-id'}`,
        clicks,
        conversions,
        conversionRate: conversionRate.toFixed(2),
        lastClickedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        lastConversionAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      },
      mockMode: true
    };
  }

  try {
    const linkDoc = await getDoc(doc(db, 'links', linkId));
    
    if (!linkDoc.exists()) {
      return { success: false, error: 'Link not found' };
    }
    
    const linkData = linkDoc.data();
    
    // Calculate conversion rate
    const clicks = linkData.clicks || 0;
    const conversions = linkData.conversions || 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    
    return {
      success: true,
      analytics: {
        linkId,
        url: linkData.url,
        clicks,
        conversions,
        conversionRate: conversionRate.toFixed(2),
        lastClickedAt: linkData.lastClickedAt,
        lastConversionAt: linkData.lastConversionAt
      }
    };
  } catch (error) {
    console.error('Error getting link analytics:', error.message);
    return { success: false, error: error.message };
  }
};
