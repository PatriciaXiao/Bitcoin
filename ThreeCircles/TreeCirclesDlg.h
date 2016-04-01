// TreeCirclesDlg.h : header file
//

#if !defined(AFX_TREECIRCLESDLG_H__D0158EDD_FB1A_416D_AA65_4C634C87532E__INCLUDED_)
#define AFX_TREECIRCLESDLG_H__D0158EDD_FB1A_416D_AA65_4C634C87532E__INCLUDED_

#if _MSC_VER > 1000
#pragma once
#endif // _MSC_VER > 1000

/////////////////////////////////////////////////////////////////////////////
// CTreeCirclesDlg dialog

class CTreeCirclesDlg : public CDialog
{
// Construction
public:
	CTreeCirclesDlg(CWnd* pParent = NULL);	// standard constructor
	void Draw3Circles(CPaintDC &dc);
	int WichCircle(CPoint &point);

// Dialog Data
	//{{AFX_DATA(CTreeCirclesDlg)
	enum { IDD = IDD_TREECIRCLES_DIALOG };
		// NOTE: the ClassWizard will add data members here
	//}}AFX_DATA

	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CTreeCirclesDlg)
	protected:
	virtual void DoDataExchange(CDataExchange* pDX);	// DDX/DDV support
	//}}AFX_VIRTUAL

// Implementation
protected:
	HICON m_hIcon;
	int m_C1_X; 
	int m_C1_Y; 
	int m_C2_X; 
	int m_C2_Y;
	int m_C3_X;
	int m_C3_Y;
//
	int	m_LastX;
	int m_LastY;
// 
	int m_CurCircle;

	// Generated message map functions
	//{{AFX_MSG(CTreeCirclesDlg)
	virtual BOOL OnInitDialog();
	afx_msg void OnSysCommand(UINT nID, LPARAM lParam);
	afx_msg void OnPaint();
	afx_msg HCURSOR OnQueryDragIcon();
	afx_msg void OnMouseMove(UINT nFlags, CPoint point);
	afx_msg void OnLButtonDown(UINT nFlags, CPoint point);
	afx_msg BOOL OnEraseBkgnd(CDC* pDC);
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

//{{AFX_INSERT_LOCATION}}
// Microsoft Visual C++ will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_TREECIRCLESDLG_H__D0158EDD_FB1A_416D_AA65_4C634C87532E__INCLUDED_)
