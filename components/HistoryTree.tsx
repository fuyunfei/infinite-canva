/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

export interface TreeNode {
  id: string;
  topic: string;
  parentId: string | null;
  children: string[];
  timestamp: number;
  depth: number;
}

export interface NavigationTree {
  nodes: Map<string, TreeNode>;
  currentNodeId: string | null;
  roots: string[];
}

interface HistoryTreeProps {
  tree: NavigationTree;
  onNavigateToNode: (nodeId: string) => void;
  className?: string;
}

interface TreeNodeItemProps {
  node: TreeNode;
  isActive: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  onNavigate: (nodeId: string) => void;
  depth: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  isActive,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onNavigate,
  depth
}) => {
  const indentWidth = depth * 16; // 16px per level
  
  return (
    <div 
      className={`tree-node ${isActive ? 'tree-node--active' : ''}`}
      style={{ paddingLeft: `${indentWidth}px` }}
    >
      <div className="tree-node__content">
        {hasChildren && (
          <button 
            className="tree-node__toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="tree-node__spacer">•</span>}
        <button
          className="tree-node__topic"
          onClick={() => onNavigate(node.id)}
          title={`Navigate to: ${node.topic}`}
        >
          {node.topic}
        </button>
      </div>
    </div>
  );
};

const HistoryTree: React.FC<HistoryTreeProps> = ({
  tree,
  onNavigateToNode,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Auto-expand path to current node
  useEffect(() => {
    if (!tree.currentNodeId) return;
    
    const pathToRoot = getPathToRoot(tree, tree.currentNodeId);
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      pathToRoot.forEach(nodeId => newExpanded.add(nodeId));
      return newExpanded;
    });
  }, [tree.currentNodeId]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  };

  const renderNode = (nodeId: string): React.ReactNode => {
    const node = tree.nodes.get(nodeId);
    if (!node) return null;

    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(nodeId);
    const isActive = tree.currentNodeId === nodeId;

    return (
      <div key={nodeId} className="tree-branch">
        <TreeNodeItem
          node={node}
          isActive={isActive}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          onNavigate={onNavigateToNode}
          depth={node.depth}
        />
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children.map(childId => renderNode(childId))}
          </div>
        )}
      </div>
    );
  };

  if (tree.roots.length === 0) {
    return (
      <div className={`history-tree ${className}`}>
        <div className="tree-empty">
          <p>Start exploring to build your navigation tree</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`history-tree ${className}`}>
      <div className="tree-header">
        <h3>Exploration History</h3>
      </div>
      <div className="tree-content">
        {tree.roots.map(rootId => renderNode(rootId))}
      </div>
    </div>
  );
};

// Helper function to get path from node to root
function getPathToRoot(tree: NavigationTree, nodeId: string): string[] {
  const path: string[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId) {
    path.push(currentId);
    const node = tree.nodes.get(currentId);
    currentId = node?.parentId || null;
  }
  
  return path;
}

export default HistoryTree;