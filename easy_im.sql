/*
 Navicat Premium Data Transfer

 Source Server         : tencent-cloud
 Source Server Type    : MariaDB
 Source Server Version : 100412
 Source Host           : 127.0.0.1:3306
 Source Schema         : easy_im

 Target Server Type    : MariaDB
 Target Server Version : 100412
 File Encoding         : 65001

 Date: 29/11/2020 17:18:05
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for im_add_info
-- ----------------------------
DROP TABLE IF EXISTS `im_add_info`;
CREATE TABLE `im_add_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '添加好友记录ID',
  `from_id` int(11) unsigned NOT NULL COMMENT '添加人ID',
  `to_id` int(11) unsigned NOT NULL COMMENT '被添加人ID',
  `from_name` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '添加人用户名',
  `to_name` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '被添加人用户名',
  `create_time` bigint(14) unsigned NOT NULL COMMENT '创建时间',
  `update_time` bigint(14) unsigned NOT NULL COMMENT '更新时间',
  `status` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '状态(0 已删除 1正常)',
  `add_status` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '加人状态(0 已删除 1 未同意 2 已添加)',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FR_ADD_INFO_FROM_ID` (`from_id`),
  KEY `FR_ADD_INFO_TO_ID` (`to_id`),
  CONSTRAINT `FR_ADD_INFO_FROM_ID` FOREIGN KEY (`from_id`) REFERENCES `im_user` (`id`),
  CONSTRAINT `FR_ADD_INFO_TO_ID` FOREIGN KEY (`to_id`) REFERENCES `im_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='加人记录表';

-- ----------------------------
-- Table structure for im_room
-- ----------------------------
DROP TABLE IF EXISTS `im_room`;
CREATE TABLE `im_room` (
  `room_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '会话表ID',
  `last_msg_time` bigint(14) unsigned NOT NULL COMMENT '最后一条消息时间戳',
  `last_msg` varchar(5000) COLLATE utf8mb4_bin NOT NULL COMMENT '最后一条消息体',
  `create_time` bigint(14) unsigned NOT NULL COMMENT '会话创建时间',
  `status` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '状态（0已删除 1 正常）',
  `type` tinyint(2) NOT NULL COMMENT '会话类型（1 系统 2单聊 3 群聊）',
  `update_time` bigint(14) unsigned NOT NULL COMMENT '更新时间',
  `create_by` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '创建人',
  `update_by` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '更新人',
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '群名称(用户名)',
  `nickname` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '群名称（修改后的群名称）',
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100075 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='会话表';

-- ----------------------------
-- Table structure for im_room_member
-- ----------------------------
DROP TABLE IF EXISTS `im_room_member`;
CREATE TABLE `im_room_member` (
  `room_member_id` bigint(14) unsigned NOT NULL AUTO_INCREMENT COMMENT '会话成员表ID',
  `room_id` int(11) unsigned NOT NULL COMMENT '会话表ID',
  `user_id` int(11) unsigned NOT NULL COMMENT '用户ID （系统ID为0）',
  `user_name` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '用户名',
  `is_top` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '是否置顶（0 否 1 是）',
  `create_time` bigint(14) unsigned NOT NULL COMMENT '创建时间',
  `update_time` bigint(14) unsigned NOT NULL COMMENT '更新时间',
  `status` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '状态（0已删除 1正常）',
  `create_by` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '创建人用户名',
  `update_by` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '更新人用户名',
  `type` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '类型（1 成员 待扩展）',
  `member_type` tinyint(1) unsigned DEFAULT NULL COMMENT '群成员类型（1 群主 2 管理员 3 成员）',
  PRIMARY KEY (`room_member_id`),
  KEY `FK_ROOM_ID` (`room_id`),
  CONSTRAINT `FK_ROOM_ID` FOREIGN KEY (`room_id`) REFERENCES `im_room` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='会话成员表';

-- ----------------------------
-- Table structure for im_room_msg
-- ----------------------------
DROP TABLE IF EXISTS `im_room_msg`;
CREATE TABLE `im_room_msg` (
  `msg_id` bigint(14) NOT NULL AUTO_INCREMENT COMMENT '聊天记录表ID',
  `content` varchar(5000) COLLATE utf8mb4_bin NOT NULL COMMENT '聊天内容',
  `sender_id` int(11) unsigned NOT NULL COMMENT '发送者ID(0 为系统ID)',
  `sender` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '发送者名称',
  `type` tinyint(1) unsigned NOT NULL COMMENT '消息类型（0系统 1 文本 2 图片  3语音 4视频）',
  `create_time` bigint(14) unsigned NOT NULL COMMENT '发送时间',
  `update_time` bigint(14) unsigned NOT NULL COMMENT '更新时间',
  `unread` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '未读（0未读 1已读）',
  `extra` varchar(5000) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '额外描述（如视频语音时长）',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态（0已删除 1正常）',
  `room_id` int(11) unsigned NOT NULL COMMENT '会话ID',
  PRIMARY KEY (`msg_id`),
  KEY `FK_MSG_ROOM_ID` (`room_id`),
  CONSTRAINT `FK_MSG_ROOM_ID` FOREIGN KEY (`room_id`) REFERENCES `im_room` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2913 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='消息记录表';

-- ----------------------------
-- Table structure for im_user
-- ----------------------------
DROP TABLE IF EXISTS `im_user`;
CREATE TABLE `im_user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户表ID',
  `name` varchar(50) COLLATE utf8mb4_bin NOT NULL COMMENT '用户名',
  `pass` char(32) COLLATE utf8mb4_bin NOT NULL COMMENT '用户密码',
  `salt` char(6) COLLATE utf8mb4_bin NOT NULL COMMENT '盐值',
  `avatar_url` varchar(500) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '头像URL',
  `create_time` bigint(14) unsigned NOT NULL COMMENT '创建日期',
  `update_time` bigint(14) unsigned NOT NULL COMMENT '更新日期',
  `create_date` char(20) COLLATE utf8mb4_bin NOT NULL COMMENT '创建日期（格式化）',
  `update_date` char(20) COLLATE utf8mb4_bin NOT NULL COMMENT '更新日期（格式化）',
  `status` tinyint(1) unsigned NOT NULL DEFAULT 1 COMMENT '状态(0已删除 1 正常)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_user` (`name`) USING BTREE COMMENT '用户名唯一性索引'
) ENGINE=InnoDB AUTO_INCREMENT=10086 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='用户表';

SET FOREIGN_KEY_CHECKS = 1;
