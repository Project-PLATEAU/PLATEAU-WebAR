import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

export interface StyledDialogProps {
    open: boolean;
    content: string;
    onClose: () => void;
  }
const StyledDialog = (props: StyledDialogProps) => {
    const { onClose, content, open } = props;
    const handleClose = () => {
        onClose();
    };
    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>{content}</DialogTitle>
            <DialogActions>
                <Button onClick={onClose} fullWidth>OK</Button>
            </DialogActions>
        </Dialog>
    );
}

export default StyledDialog;