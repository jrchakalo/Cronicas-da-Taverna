// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
	const message = args.map((arg) => String(arg));
	const shouldIgnore = message.some((segment) =>
		segment.includes('ReactDOMTestUtils.act') ||
		segment.includes('react-dom/test-utils')
	);
	if (shouldIgnore) {
		return;
	}
	originalConsoleError(...args);
};

jest.mock('react-markdown', () => {
	const React = require('react');
	return {
		__esModule: true,
		default: ({ children }: { children: React.ReactNode }) =>
			React.createElement(React.Fragment, null, children),
	};
});

jest.mock('react-syntax-highlighter', () => {
	const React = require('react');
	return {
		__esModule: true,
		Prism: ({ children }: { children: React.ReactNode }) =>
			React.createElement('pre', null, children),
	};
});

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
	__esModule: true,
	tomorrow: {},
}));

jest.mock('./services/notificationService', () => ({
	notificationService: {
		getNotifications: jest.fn().mockResolvedValue({ notifications: [], unreadCount: 0 }),
		markRead: jest.fn().mockResolvedValue({}),
		markAllRead: jest.fn().mockResolvedValue({}),
		deleteNotification: jest.fn().mockResolvedValue({}),
		clearAll: jest.fn().mockResolvedValue({}),
	},
}));