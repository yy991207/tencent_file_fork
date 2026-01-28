/**
 * 文件列表组件
 * 显示文件夹内的文件和子文件夹列表
 */
import React from 'react';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
// 图标通过 FolderIcon 组件渲染
import { FileItem, FileType } from '../../types';
import FolderIcon from '../FolderIcon';
import styles from './index.module.less';

interface FileListProps {
  files: FileItem[];                          // 文件列表数据
  onFileClick?: (file: FileItem) => void;     // 文件点击回调
  onFolderClick?: (folder: FileItem) => void; // 文件夹点击回调
  selectedKeys?: string[];                     // 选中的文件ID
  onSelectionChange?: (keys: string[]) => void; // 选择变化回调
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFileClick,
  onFolderClick,
  selectedKeys = [],
  onSelectionChange,
}) => {
  /**
   * 根据文件类型渲染图标
   */
  const renderFileIcon = (type: FileType) => {
    if (type === FileType.FOLDER) {
      return <FolderIcon size="small" />;
    }
    // 文档类型图标 - 蓝色背景的M图标
    return (
      <div className={styles.docIcon}>
        <span>M</span>
      </div>
    );
  };

  /**
   * 处理行点击事件
   */
  const handleRowClick = (record: FileItem) => {
    if (record.type === FileType.FOLDER) {
      onFolderClick?.(record);
    } else {
      onFileClick?.(record);
    }
  };

  /**
   * 表格列配置
   */
  const columns: TableColumnsType<FileItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FileItem) => (
        <div className={styles.nameCell}>
          {renderFileIcon(record.type)}
          <span className={styles.fileName}>{name}</span>
        </div>
      ),
    },
    {
      title: '所有者',
      dataIndex: 'owner',
      key: 'owner',
      width: 80,
      render: (owner: string) => (
        <span className={styles.ownerText}>{owner}</span>
      ),
    },
    {
      title: '最近编辑',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 120,
      render: (time: string) => (
        <span className={styles.timeText}>{time}</span>
      ),
    },
  ];

  return (
    <div className={styles.fileList}>
      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        pagination={false}
        showHeader={true}
        size="small"
        rowSelection={
          onSelectionChange
            ? {
                selectedRowKeys: selectedKeys,
                onChange: (keys) => onSelectionChange(keys as string[]),
              }
            : undefined
        }
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          className: styles.tableRow,
        })}
      />
    </div>
  );
};

export default FileList;
