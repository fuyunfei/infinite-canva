/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TopicNode } from '../hooks/useTopicHistory';

interface TopicOutlineProps {
  // History related props
  historyNodes: Record<string, TopicNode>;
  currentNodeId: string | null;
  rootNodeIds: string[];
  onNavigateToNode: (nodeId: string) => void;
  onClearHistory: () => void;
}

const TopicOutline: React.FC<TopicOutlineProps> = ({
  historyNodes,
  currentNodeId,
  rootNodeIds,
  onNavigateToNode,
  onClearHistory
}) => {
  // Render history tree recursively with Notion-like styling
  const renderHistoryNode = (nodeId: string, level: number = 0) => {
    const node = historyNodes[nodeId];
    if (!node) return null;

    const isCurrent = nodeId === currentNodeId;
    const hasChildren = node.children.length > 0;
    const indentWidth = level * 16;

    return (
      <div key={nodeId}>
        <div 
          className="outline-item"
          onClick={() => onNavigateToNode(nodeId)}
          style={{
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: '1.6',
            padding: '2px 0',
            paddingLeft: `${indentWidth}px`,
            backgroundColor: isCurrent ? '#f0f7ff' : 'transparent',
            color: isCurrent ? '#2563eb' : '#374151',
            fontWeight: isCurrent ? 500 : 400,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isCurrent) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.color = '#1f2937';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrent) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.transform = 'translateX(0)';
            }
          }}
        >
          
          {node.topic}
          
        </div>
        
        {/* Render children */}
        {hasChildren && (
          <div>
            {node.children.map((childId) => 
              renderHistoryNode(childId, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (rootNodeIds.length === 0) {
    return (
      <div className="topic-outline" style={{ padding: '16px' }}>
        <div style={{ 
          color: '#666', 
          fontSize: '14px',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          开始探索以构建导航树
        </div>
      </div>
    );
  }

  return (
    <div className="topic-outline" style={{
      padding: '16px 8px',
      height: '100%',
      overflow: 'visible',
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      boxShadow: 'none'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        padding: '0 8px'
      }}>
        <h3 style={{
          margin: '0',
          fontSize: '13px',
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          探索历史
        </h3>
        
        {Object.keys(historyNodes).length > 0 && (
          <button 
            onClick={onClearHistory}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#999',
              padding: '0'
            }}
          >
            清除
          </button>
        )}
      </div>

      {/* Tree structure */}
      <div className="history-tree">
        {rootNodeIds.map((rootId) => 
          renderHistoryNode(rootId, 0)
        )}
      </div>
    </div>
  );
};

export default TopicOutline;