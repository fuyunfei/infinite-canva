/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect } from 'react';

export interface TopicNode {
  id: string;
  topic: string;
  timestamp: number;
  parentId: string | null;
  children: string[];
  // Cached content to avoid re-generating
  cachedCards?: any[];
  cachedAsciiArt?: any;
  generationTime?: number;
  totalInputWords?: number;
  totalOutputWords?: number;
}

export interface TopicHistoryState {
  nodes: Record<string, TopicNode>;
  currentNodeId: string | null;
  rootNodeIds: string[];
}

const STORAGE_KEY = 'infinite-wiki-history';

export const useTopicHistory = () => {
  const [history, setHistory] = useState<TopicHistoryState>(() => {
    // Load from localStorage on initialization
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load history from localStorage:', error);
    }
    return {
      nodes: {},
      currentNodeId: null,
      rootNodeIds: []
    };
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save history to localStorage:', error);
    }
  }, [history]);

  const addTopic = (topic: string, parentId: string | null = null) => {
    const nodeId = `${topic}-${Date.now()}`;
    const newNode: TopicNode = {
      id: nodeId,
      topic,
      timestamp: Date.now(),
      parentId,
      children: []
    };

    setHistory(prev => {
      const newNodes = { ...prev.nodes, [nodeId]: newNode };
      
      // Update parent's children array
      if (parentId && newNodes[parentId]) {
        newNodes[parentId] = {
          ...newNodes[parentId],
          children: [...newNodes[parentId].children, nodeId]
        };
      }

      const newRootNodeIds = parentId === null 
        ? [...prev.rootNodeIds, nodeId]
        : prev.rootNodeIds;

      return {
        nodes: newNodes,
        currentNodeId: nodeId,
        rootNodeIds: newRootNodeIds
      };
    });

    return nodeId;
  };

  const navigateToNode = (nodeId: string) => {
    if (history.nodes[nodeId]) {
      setHistory(prev => ({
        ...prev,
        currentNodeId: nodeId
      }));
    }
  };

  const getCurrentNode = () => {
    return history.currentNodeId ? history.nodes[history.currentNodeId] : null;
  };

  const getNodePath = (nodeId: string): TopicNode[] => {
    const path: TopicNode[] = [];
    let currentId = nodeId;
    
    while (currentId && history.nodes[currentId]) {
      const node = history.nodes[currentId];
      path.unshift(node);
      currentId = node.parentId;
    }
    
    return path;
  };

  const getRecentNodes = (limit: number = 10): TopicNode[] => {
    return Object.values(history.nodes)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  };

  const updateNodeContent = (nodeId: string, content: {
    cards?: any[];
    asciiArt?: any;
    generationTime?: number;
    totalInputWords?: number;
    totalOutputWords?: number;
  }) => {
    setHistory(prev => {
      const newNodes = { ...prev.nodes };
      if (newNodes[nodeId]) {
        newNodes[nodeId] = {
          ...newNodes[nodeId],
          cachedCards: content.cards,
          cachedAsciiArt: content.asciiArt,
          generationTime: content.generationTime,
          totalInputWords: content.totalInputWords,
          totalOutputWords: content.totalOutputWords
        };
      }
      return {
        ...prev,
        nodes: newNodes
      };
    });
  };

  const clearHistory = () => {
    setHistory({
      nodes: {},
      currentNodeId: null,
      rootNodeIds: []
    });
  };

  return {
    history,
    addTopic,
    navigateToNode,
    getCurrentNode,
    getNodePath,
    getRecentNodes,
    updateNodeContent,
    clearHistory
  };
};