// TreeCirclesDlg.cpp : implementation file
//

#include "stdafx.h"
#include "TreeCircles.h"
#include "TreeCirclesDlg.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#undef THIS_FILE
static char THIS_FILE[] = __FILE__;
#endif

#define CIRCLESIZE 100

/////////////////////////////////////////////////////////////////////////////
// CAboutDlg dialog used for App About

class CAboutDlg : public CDialog
{
public:
	CAboutDlg();

// Dialog Data
	//{{AFX_DATA(CAboutDlg)
	enum { IDD = IDD_ABOUTBOX };
	//}}AFX_DATA

	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CAboutDlg)
	protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV support
	//}}AFX_VIRTUAL

// Implementation
protected:
	//{{AFX_MSG(CAboutDlg)
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};

CAboutDlg::CAboutDlg() : CDialog(CAboutDlg::IDD)
{
	//{{AFX_DATA_INIT(CAboutDlg)
	//}}AFX_DATA_INIT
}

void CAboutDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialog::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CAboutDlg)
	//}}AFX_DATA_MAP
}

BEGIN_MESSAGE_MAP(CAboutDlg, CDialog)
	//{{AFX_MSG_MAP(CAboutDlg)
		// No message handlers
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CTreeCirclesDlg dialog

CTreeCirclesDlg::CTreeCirclesDlg(CWnd* pParent /*=NULL*/)
	: CDialog(CTreeCirclesDlg::IDD, pParent)
{
	//{{AFX_DATA_INIT(CTreeCirclesDlg)
		// NOTE: the ClassWizard will add member initialization here
	//}}AFX_DATA_INIT
	// Note that LoadIcon does not require a subsequent DestroyIcon in Win32
	m_hIcon = AfxGetApp()->LoadIcon(IDR_MAINFRAME);
}

void CTreeCirclesDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialog::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CTreeCirclesDlg)
		// NOTE: the ClassWizard will add DDX and DDV calls here
	//}}AFX_DATA_MAP
}

BEGIN_MESSAGE_MAP(CTreeCirclesDlg, CDialog)
	//{{AFX_MSG_MAP(CTreeCirclesDlg)
	ON_WM_SYSCOMMAND()
	ON_WM_PAINT()
	ON_WM_QUERYDRAGICON()
	ON_WM_MOUSEMOVE()
	ON_WM_LBUTTONDOWN()
	ON_WM_ERASEBKGND()
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CTreeCirclesDlg message handlers

BOOL CTreeCirclesDlg::OnInitDialog()
{
	CDialog::OnInitDialog();

	// Add "About..." menu item to system menu.

	// IDM_ABOUTBOX must be in the system command range.
	ASSERT((IDM_ABOUTBOX & 0xFFF0) == IDM_ABOUTBOX);
	ASSERT(IDM_ABOUTBOX < 0xF000);

	CMenu* pSysMenu = GetSystemMenu(FALSE);
	if (pSysMenu != NULL)
	{
		CString strAboutMenu;
		strAboutMenu.LoadString(IDS_ABOUTBOX);
		if (!strAboutMenu.IsEmpty())
		{
			pSysMenu->AppendMenu(MF_SEPARATOR);
			pSysMenu->AppendMenu(MF_STRING, IDM_ABOUTBOX, strAboutMenu);
		}
	}

	// Set the icon for this dialog.  The framework does this automatically
	//  when the application's main window is not a dialog
	SetIcon(m_hIcon, TRUE);			// Set big icon
	SetIcon(m_hIcon, FALSE);		// Set small icon
	
	// TODO: Add extra initialization here
	CRect rc;
	GetClientRect(&rc);

	m_C1_X=rc.Width()/4-CIRCLESIZE/2;		m_C1_Y=rc.Height()/2-CIRCLESIZE/2;
	m_C2_X=rc.Width()/2-CIRCLESIZE/2;		m_C2_Y=rc.Height()/2-CIRCLESIZE/2;
	m_C3_X=rc.Width()*3/4-CIRCLESIZE/2;		m_C3_Y=rc.Height()/2-CIRCLESIZE/2;
	
	return TRUE;  // return TRUE  unless you set the focus to a control
}

void CTreeCirclesDlg::OnSysCommand(UINT nID, LPARAM lParam)
{
	if ((nID & 0xFFF0) == IDM_ABOUTBOX)
	{
		CAboutDlg dlgAbout;
		dlgAbout.DoModal();
	}
	else
	{
		CDialog::OnSysCommand(nID, lParam);
	}
}

void CTreeCirclesDlg::Draw3Circles(CPaintDC &dc)
{// single circle
	HRGN hc1,hc2,hc3;
	hc1=CreateEllipticRgn(m_C1_X,m_C1_Y,m_C1_X+CIRCLESIZE,m_C1_Y+CIRCLESIZE);
	hc2=CreateEllipticRgn(m_C2_X,m_C2_Y,m_C2_X+CIRCLESIZE,m_C2_Y+CIRCLESIZE);
	hc3=CreateEllipticRgn(m_C3_X,m_C3_Y,m_C3_X+CIRCLESIZE,m_C3_Y+CIRCLESIZE);
	HBRUSH hb1,hb2,hb3;
	hb1=CreateSolidBrush(RGB(255,0,0));
	hb2=CreateSolidBrush(RGB(0,255,0));
	hb3=CreateSolidBrush(RGB(0,0,255));
//
	FillRgn(dc.m_hDC,hc1,hb1);
	FillRgn(dc.m_hDC,hc2,hb2);
	FillRgn(dc.m_hDC,hc3,hb3);
// overlopped region of 2 circles
	HRGN hc12,hc23,hc13;
	hc12=CreateEllipticRgn(0,0,0,0);
	hc23=CreateEllipticRgn(0,0,0,0);
	hc13=CreateEllipticRgn(0,0,0,0);

	CombineRgn(hc12,hc1,hc2,RGN_AND);// mini
	CombineRgn(hc23,hc2,hc3,RGN_AND);// mini
	CombineRgn(hc13,hc1,hc3,RGN_AND);// mini

	HBRUSH hb12,hb23,hb13;
	hb12=CreateSolidBrush(RGB(255,255,0));
	hb23=CreateSolidBrush(RGB(0,255,255));
	hb13=CreateSolidBrush(RGB(255,0,255));
//
	FillRgn(dc.m_hDC,hc12,hb12);
	FillRgn(dc.m_hDC,hc23,hb23);
	FillRgn(dc.m_hDC,hc13,hb13);
//  overlopped region of 3 circles
	HRGN hc123;
	hc123=CreateEllipticRgn(0,0,0,0);
	CombineRgn(hc123,hc12,hc23,RGN_AND);// mini
	CombineRgn(hc123,hc123,hc13,RGN_AND);// mini
//
	HBRUSH hb123;
	hb123=CreateSolidBrush(RGB(255,255,255));
	FillRgn(dc.m_hDC,hc123,hb123);
//
	DeleteObject(hc1);
	DeleteObject(hc2);
	DeleteObject(hc3);
//
	DeleteObject(hb1);
	DeleteObject(hb2);
	DeleteObject(hb3);
//
	DeleteObject(hc12);
	DeleteObject(hc23);
	DeleteObject(hc13);
//
	DeleteObject(hb12);
	DeleteObject(hb23);
	DeleteObject(hb13);
//
	DeleteObject(hc123);
	DeleteObject(hb123);
}
// If you add a minimize button to your dialog, you will need the code below
//  to draw the icon.  For MFC applications using the document/view model,
//  this is automatically done for you by the framework.
void CTreeCirclesDlg::OnPaint() 
{
	if (IsIconic())
	{
		CPaintDC dc(this); // device context for painting

		SendMessage(WM_ICONERASEBKGND, (WPARAM) dc.GetSafeHdc(), 0);

		// Center icon in client rectangle
		int cxIcon = GetSystemMetrics(SM_CXICON);
		int cyIcon = GetSystemMetrics(SM_CYICON);
		CRect rect;
		GetClientRect(&rect);
		int x = (rect.Width() - cxIcon + 1) / 2;
		int y = (rect.Height() - cyIcon + 1) / 2;

		// Draw the icon
		dc.DrawIcon(x, y, m_hIcon);
	}
	else
	{
		CPaintDC dc(this); // device context for painting
		Draw3Circles(dc);
		//CDialog::OnPaint();
	}
}

// The system calls this to obtain the cursor to display while the user drags
//  the minimized window.
HCURSOR CTreeCirclesDlg::OnQueryDragIcon()
{
	return (HCURSOR) m_hIcon;
}
//
int CTreeCirclesDlg::WichCircle(CPoint &point)
{
	if(GetKeyState(VK_LBUTTON) & 0x8000)
	{// drag
		CDC *pDC=GetDC();
		COLORREF color=pDC->GetPixel(point);
		ReleaseDC(pDC);
		//afxDump << color << "\r\n";
		switch(color)
		{
		case 0xFF://red
			return 1;
		case 0xFF00:// green
			return 2;
		case 0xFF0000:
			return 3;
		default:
			return 0;
		}
	}
	return 0;
}
//
void CTreeCirclesDlg::OnMouseMove(UINT nFlags, CPoint point) 
{
	// TODO: Add your message handler code here and/or call default
	HRGN tmpRgn;
	int  *ptmpX;
	int  *ptmpY;
	int  which; 
	CRect oldRc;

	if(nFlags==MK_LBUTTON)
	{// drag
		which=WichCircle(point);
//		afxDump << which << "\r\n";
		switch(which)
		{
		case 0:
		return;
		case 1:
			ptmpX=&m_C1_X;
			ptmpY=&m_C1_Y;
			tmpRgn=CreateEllipticRgn(m_C1_X,m_C1_Y,m_C1_X+CIRCLESIZE,m_C1_Y+CIRCLESIZE);
		break;
		case 2:
			ptmpX=&m_C2_X;
			ptmpY=&m_C2_Y;
			tmpRgn=CreateEllipticRgn(m_C2_X,m_C2_Y,m_C2_X+CIRCLESIZE,m_C2_Y+CIRCLESIZE);
		break;
		case 3:
			ptmpX=&m_C3_X;
			ptmpY=&m_C3_Y;
			tmpRgn=CreateEllipticRgn(m_C3_X,m_C3_Y,m_C3_X+CIRCLESIZE,m_C3_Y+CIRCLESIZE);
		break;
		}
// add old clip region
		oldRc.left=*ptmpX;
		oldRc.top=*ptmpY;
		oldRc.right=oldRc.left+CIRCLESIZE;
		oldRc.bottom=oldRc.top+CIRCLESIZE;
		InvalidateRect(oldRc, FALSE);
// move circle
		if(PtInRegion(tmpRgn,point.x,point.y))
		{
			*ptmpX = point.x-m_LastX;
			*ptmpY = point.y-m_LastY;;
// extra clip region
			oldRc.left=*ptmpX;
			oldRc.top =*ptmpY;
			oldRc.right=oldRc.left+CIRCLESIZE;
			oldRc.bottom=oldRc.top+CIRCLESIZE;
			InvalidateRect(oldRc, TRUE);
		}
	}
//	CDialog::OnMouseMove(nFlags, point);
}
//
void CTreeCirclesDlg::OnLButtonDown(UINT nFlags, CPoint point) 
{
	// TODO: Add your message handler code here and/or call default
	m_CurCircle=WichCircle(point);
	switch(m_CurCircle)
	{
		case 0:
		return;
		case 1:
			m_LastX=point.x-m_C1_X;
			m_LastY=point.y-m_C1_Y;
		break;
		case 2:
			m_LastX=point.x-m_C2_X;
			m_LastY=point.y-m_C2_Y;
		break;
		case 3:
			m_LastX=point.x-m_C3_X;
			m_LastY=point.y-m_C3_Y;
		break;
	}
//	CDialog::OnLButtonDown(nFlags, point);
}

BOOL CTreeCirclesDlg::OnEraseBkgnd(CDC* pDC) 
{
	// TODO: Add your message handler code here and/or call default
	CRect rc;
	HRGN tmpRgn,clipRgn;
	GetClientRect(&rc);
	CRect clipRc;
	pDC->GetClipBox(&clipRc);
	if(clipRc.right != rc.right )
	{// make the circle not be flashing
		clipRgn=CreateRectRgn(clipRc.left,clipRc.top,clipRc.right,clipRc.bottom);
		switch(m_CurCircle)
		{
		case 1:
			tmpRgn=CreateEllipticRgn(m_C1_X,m_C1_Y,m_C1_X+CIRCLESIZE,m_C1_Y+CIRCLESIZE);
			break;
		case 2:
			tmpRgn=CreateEllipticRgn(m_C2_X,m_C2_Y,m_C2_X+CIRCLESIZE,m_C2_Y+CIRCLESIZE);
			break;
		case 3:
			tmpRgn=CreateEllipticRgn(m_C3_X,m_C3_Y,m_C3_X+CIRCLESIZE,m_C3_Y+CIRCLESIZE);
			break;
		}
		CombineRgn(clipRgn,clipRgn,tmpRgn,RGN_XOR);
		SelectClipRgn(pDC->m_hDC,clipRgn);
	}
	BOOL ret=CDialog::OnEraseBkgnd(pDC);
	SelectClipRgn(pDC->m_hDC,0);
//
	DeleteObject(tmpRgn);
	DeleteObject(clipRgn);
// 
	return ret;

}
